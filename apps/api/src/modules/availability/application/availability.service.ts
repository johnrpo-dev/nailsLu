import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { MINUTOS_TRASLADO_DOMICILIO } from "../../../common/booking-rules";
import { festivoDe, festivosDe } from "../../../common/festivos-colombia";
import { ACTIVE_BOOKING_STATUSES, AvailabilityBlockType, ServiceLocation } from "../../../common/enums";
import { PrismaService } from "../../../prisma/prisma.service";
import {
  addMinutes,
  ahoraEnElSalon,
  minutesFromTime,
  rangesOverlap,
  timeFromMinutes,
  todayIsoDate,
} from "./time.utils";

type AvailabilityQuery = {
  date: string;
  durationMinutes: number;
  staffId?: string;
  /**
   * Modalidad de la cita que se quiere agendar. A domicilio la franja ocupa el
   * servicio mas el traslado, asi que hay horas que dejan de caber aunque el
   * servicio si cupiera.
   */
  serviceLocation?: string;
};

/** Minutos de traslado que arrastra una cita, a cada lado del servicio. */
function trasladoDe(serviceLocation: string | undefined) {
  return serviceLocation === ServiceLocation.DOMICILIO ? MINUTOS_TRASLADO_DOMICILIO : 0;
}

/**
 * Hueco que una cita ocupa de verdad en la agenda.
 *
 * A domicilio hay que ir y volver, asi que el traslado cuenta a los dos lados:
 * para estar a las 16:00 en casa de la clienta hay que salir sobre las 15:10.
 *
 * El inicio se acota a las 00:00 para que restar no produzca horas negativas,
 * que al formatearse darian cadenas sin sentido y romperian las comparaciones
 * de texto con las que se ordena todo.
 */
export function huecoOcupado(startTime: string, endTime: string, traslado: number) {
  const inicio = Math.max(0, minutesFromTime(startTime) - traslado);
  return { inicio: timeFromMinutes(inicio), fin: addMinutes(endTime, traslado) };
}

type Ventana = { startTime: string; endTime: string };

function aFecha(iso: string) {
  return new Date(`${iso}T00:00:00.000Z`);
}

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  async listSlots(query: AvailabilityQuery) {
    const date = aFecha(query.date);
    const weekday = date.getUTCDay();
    const businessHours = await this.prisma.businessHour.findMany({
      where: { weekday, isActive: true },
      orderBy: { startTime: "asc" },
    });
    const bookings = await this.prisma.booking.findMany({
      where: {
        scheduledDate: date,
        staffId: query.staffId,
        status: { in: ACTIVE_BOOKING_STATUSES },
      },
    });
    const blocks = await this.prisma.availabilityBlock.findMany({
      where: {
        date,
        OR: [{ staffId: query.staffId ?? null }, { staffId: null }],
      },
    });

    const abiertas = blocks
      .filter((b) => b.type === AvailabilityBlockType.AVAILABLE)
      .map((b) => ({ startTime: b.startTime, endTime: b.endTime }));

    /**
     * Las ventanas abiertas del dia son el horario base mas las excepciones de
     * tipo AVAILABLE, que sirven para abrir un domingo o extender una tarde
     * puntual.
     *
     * En festivo el horario base no cuenta: el salon esta cerrado salvo que se
     * haya abierto ese dia a mano. Y cuando se abre, valen solo las horas que
     * se indicaron, no la jornada completa: quien abre un 25 de diciembre suele
     * hacerlo unas horas, no el dia entero.
     */
    const festivo = festivoDe(query.date);
    const ventanas: Ventana[] = festivo
      ? abiertas
      : [...businessHours.map((h) => ({ startTime: h.startTime, endTime: h.endTime })), ...abiertas];

    const bloqueados = blocks.filter((b) => b.type === AvailabilityBlockType.BLOCKED);
    const slots = new Set<string>();

    /**
     * No se agenda en el pasado.
     *
     * Faltaba por completo: el calculo solo miraba horario, reservas y
     * bloqueos, nunca el reloj. A las 10:19 de la manana seguia ofreciendo las
     * 8:30 del mismo dia, y como reservar valida contra esta misma funcion,
     * tampoco lo frenaba el servidor.
     *
     * Un dia entero ya pasado no tiene ninguna franja. En el dia de hoy se
     * descartan las que ya empezaron; se compara con `<=` para no ofrecer una
     * franja justo en el minuto en que arranca.
     */
    const ahora = ahoraEnElSalon();
    if (query.date < ahora.fecha) {
      return { date: query.date, durationMinutes: query.durationMinutes, slots: [], holiday: festivo };
    }
    const minutoMinimo = query.date === ahora.fecha ? ahora.minutos : -1;

    /**
     * `endTime` es la hora de la ULTIMA CITA que se acepta, no la hora a la que
     * todo debe estar terminado.
     *
     * Antes se exigia que el servicio cupiera completo antes del cierre, asi
     * que con cierre a las 18:00 un servicio de una hora dejaba de ofrecerse a
     * las 17:01. En el salon no funciona asi: a las 18:00 se toma la ultima
     * clienta y se termina cuando toque.
     */
    for (const ventana of ventanas) {
      for (
        let cursor = minutesFromTime(ventana.startTime);
        cursor <= minutesFromTime(ventana.endTime);
        cursor += 30
      ) {
        if (cursor <= minutoMinimo) continue;

        const startTime = timeFromMinutes(cursor);
        const endTime = addMinutes(startTime, query.durationMinutes);

        /*
         * Lo que la franja ocupa de verdad incluye el traslado de ida y vuelta,
         * no solo el servicio. Se compara con el hueco de cada reserva
         * existente, que arrastra el traslado con el que se acepto: por eso el
         * margen se guarda en la fila y no se recalcula aqui.
         *
         * El hueco solo se usa para detectar choques, nunca para decidir si la
         * franja entra en la jornada. Asi el traslado de ida no recorta la
         * primera cita del dia: a esa se puede salir de casa directamente.
         */
        const hueco = huecoOcupado(startTime, endTime, trasladoDe(query.serviceLocation));

        const chocaConReserva = bookings.some((booking) => {
          const ocupado = huecoOcupado(booking.startTime, booking.endTime, booking.travelBufferMinutes);
          return rangesOverlap(hueco.inicio, hueco.fin, ocupado.inicio, ocupado.fin);
        });
        const chocaConBloqueo = bloqueados.some((block) =>
          rangesOverlap(hueco.inicio, hueco.fin, block.startTime, block.endTime),
        );

        if (!chocaConReserva && !chocaConBloqueo) {
          slots.add(startTime);
        }
      }
    }

    // Un mismo horario puede caer en dos ventanas solapadas: se ordena y unifica.
    return {
      date: query.date,
      durationMinutes: query.durationMinutes,
      slots: [...slots].sort(),
      /** Nombre del festivo, para poder decir por que no hay horarios. */
      holiday: festivo,
    };
  }

  async assertSlotAvailable(query: AvailabilityQuery & { startTime: string; ignoreBookingId?: string }) {
    const slots = await this.listSlots(query);
    return slots.slots.includes(query.startTime);
  }

  /**
   * Proximos festivos, para que el panel los muestre antes de que lleguen.
   *
   * Se cierran solos, asi que la duena no tiene que hacer nada; verlos sirve
   * para lo contrario, decidir si va a trabajar alguno y abrirlo a mano.
   */
  proximosFestivos(cuantos = 8) {
    const hoy = todayIsoDate();
    const ano = Number(hoy.slice(0, 4));
    // Se miran dos anos para que en diciembre sigan apareciendo los de enero.
    const todos = [...festivosDe(ano), ...festivosDe(ano + 1)]
      .filter(([fecha]) => fecha >= hoy)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(0, cuantos);

    return todos.map(([date, name]) => ({ date, name }));
  }

  // --- Bloqueos y excepciones -------------------------------------------------

  listBlocks(range: { from?: string; to?: string } = {}) {
    // Por defecto se miran los bloqueos de hoy en adelante: los pasados ya no
    // afectan a ninguna reserva nueva.
    const desde = range.from ? aFecha(range.from) : aFecha(new Date().toISOString().slice(0, 10));
    return this.prisma.availabilityBlock.findMany({
      where: { date: { gte: desde, ...(range.to ? { lte: aFecha(range.to) } : {}) } },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });
  }

  createBlock(dto: {
    staffId?: string;
    date: string;
    startTime: string;
    endTime: string;
    type: string;
    reason?: string;
  }) {
    if (minutesFromTime(dto.endTime) <= minutesFromTime(dto.startTime)) {
      throw new BadRequestException("La hora de fin debe ser posterior a la de inicio");
    }

    return this.prisma.availabilityBlock.create({
      data: {
        staffId: dto.staffId,
        date: aFecha(dto.date),
        startTime: dto.startTime,
        endTime: dto.endTime,
        type: dto.type,
        reason: dto.reason,
      },
    });
  }

  async deleteBlock(id: string) {
    const existe = await this.prisma.availabilityBlock.findUnique({ where: { id }, select: { id: true } });
    if (!existe) throw new NotFoundException("El bloqueo ya no existe");
    return this.prisma.availabilityBlock.delete({ where: { id } });
  }

  // --- Horario base semanal ---------------------------------------------------

  listBusinessHours() {
    return this.prisma.businessHour.findMany({ orderBy: [{ weekday: "asc" }, { startTime: "asc" }] });
  }

  /**
   * Reemplaza la semana completa. Es mas simple y predecible que parchear fila
   * a fila, porque la clave unica del modelo incluye las horas: cambiar un
   * horario cambiaria la identidad de la fila.
   */
  async replaceBusinessHours(hours: { weekday: number; startTime: string; endTime: string; isActive?: boolean }[]) {
    for (const h of hours) {
      if (minutesFromTime(h.endTime) <= minutesFromTime(h.startTime)) {
        throw new BadRequestException(`El horario del dia ${h.weekday} termina antes de empezar`);
      }
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.businessHour.deleteMany({});
      for (const h of hours) {
        await tx.businessHour.create({
          data: {
            weekday: h.weekday,
            startTime: h.startTime,
            endTime: h.endTime,
            isActive: h.isActive ?? true,
          },
        });
      }
      return tx.businessHour.findMany({ orderBy: [{ weekday: "asc" }, { startTime: "asc" }] });
    });
  }
}
