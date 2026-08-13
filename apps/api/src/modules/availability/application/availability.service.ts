import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ACTIVE_BOOKING_STATUSES, AvailabilityBlockType } from "../../../common/enums";
import { PrismaService } from "../../../prisma/prisma.service";
import { addMinutes, minutesFromTime, rangesOverlap, timeFromMinutes } from "./time.utils";

type AvailabilityQuery = {
  date: string;
  durationMinutes: number;
  staffId?: string;
};

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

    /**
     * Las ventanas abiertas del dia son el horario base mas las excepciones de
     * tipo AVAILABLE, que sirven para abrir un domingo o extender una tarde
     * puntual. Antes se ignoraban y el enum no tenia ningun efecto.
     */
    const ventanas: Ventana[] = [
      ...businessHours.map((h) => ({ startTime: h.startTime, endTime: h.endTime })),
      ...blocks
        .filter((b) => b.type === AvailabilityBlockType.AVAILABLE)
        .map((b) => ({ startTime: b.startTime, endTime: b.endTime })),
    ];

    const bloqueados = blocks.filter((b) => b.type === AvailabilityBlockType.BLOCKED);
    const slots = new Set<string>();

    for (const ventana of ventanas) {
      for (
        let cursor = minutesFromTime(ventana.startTime);
        cursor + query.durationMinutes <= minutesFromTime(ventana.endTime);
        cursor += 30
      ) {
        const startTime = timeFromMinutes(cursor);
        const endTime = addMinutes(startTime, query.durationMinutes);

        const chocaConReserva = bookings.some((booking) =>
          rangesOverlap(startTime, endTime, booking.startTime, booking.endTime),
        );
        const chocaConBloqueo = bloqueados.some((block) =>
          rangesOverlap(startTime, endTime, block.startTime, block.endTime),
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
    };
  }

  async assertSlotAvailable(query: AvailabilityQuery & { startTime: string; ignoreBookingId?: string }) {
    const slots = await this.listSlots(query);
    return slots.slots.includes(query.startTime);
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
