import { BadRequestException, ConflictException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import crypto from "node:crypto";
import {
  ACTIVE_BOOKING_STATUSES,
  BookingSource,
  BookingStatus,
  ServiceLocation,
  type BookingStatus as BookingStatusValue,
} from "../../../common/enums";
import { POLITICA_DATOS_VERSION, RETENCION_INTENTOS_DIAS } from "../../../common/privacy";
import { PrismaService } from "../../../prisma/prisma.service";
import { addMinutes, rangesOverlap, todayIsoDate } from "../../availability/application/time.utils";
import { AvailabilityService } from "../../availability/application/availability.service";
import { ServicesService } from "../../services/application/services.service";
import { CreatePublicBookingDto } from "../presentation/dto/create-public-booking.dto";

/**
 * Forma de una reserva hacia afuera. Sin `totalPrice` ni `priceSnapshot`: esas
 * columnas quedaron en la base por compatibilidad, pero ya no se usan ni salen.
 */
const CAMPOS_RESERVA = {
  id: true,
  publicToken: true,
  status: true,
  scheduledDate: true,
  startTime: true,
  endTime: true,
  totalDurationMinutes: true,
  notes: true,
  serviceLocation: true,
  address: true,
  source: true,
  createdAt: true,
  client: { select: { id: true, fullName: true, phone: true } },
  staff: { select: { id: true, name: true } },
  services: {
    select: { id: true, serviceId: true, serviceNameSnapshot: true, durationSnapshotMinutes: true },
  },
} as const;

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly availability: AvailabilityService,
    private readonly services: ServicesService,
  ) {}

  listAdmin(query: { scope?: "active" | "all" | "today"; date?: string } = {}) {
    const scope = query.scope ?? "active";
    const where: Prisma.BookingWhereInput = {};

    if (scope === "active") {
      where.status = { in: ACTIVE_BOOKING_STATUSES };
    }
    if (scope === "today") {
      where.scheduledDate = new Date(`${todayIsoDate()}T00:00:00.000Z`);
    }
    if (query.date) {
      where.scheduledDate = new Date(`${query.date}T00:00:00.000Z`);
    }

    // Las activas se leen de la mas proxima a la mas lejana, que es el orden en
    // que ocurren; el historico se lee de la mas reciente hacia atras.
    const cronologico = scope === "all" ? "desc" : "asc";

    return this.prisma.booking.findMany({
      where,
      select: CAMPOS_RESERVA,
      orderBy: [{ scheduledDate: cronologico }, { startTime: "asc" }],
    });
  }

  async getPublicStatus(publicToken: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { publicToken },
      select: {
        status: true,
        scheduledDate: true,
        startTime: true,
        endTime: true,
        totalDurationMinutes: true,
        /*
         * La modalidad si sale, porque le sirve a la clienta para comprobar que
         * pidio lo que queria. La direccion no: el codigo viaja en la URL y
         * puede acabar reenviado, y nadie con ese enlace deberia poder leer
         * donde vive.
         */
        serviceLocation: true,
      },
    });
    if (!booking) {
      throw new BadRequestException("Invalid booking token");
    }
    return booking;
  }

  async cancelPublic(publicToken: string) {
    const booking = await this.prisma.booking.findUnique({ where: { publicToken } });
    if (!booking) {
      throw new BadRequestException("Invalid booking token");
    }
    if (!ACTIVE_BOOKING_STATUSES.includes(booking.status as BookingStatusValue)) {
      throw new BadRequestException("Booking cannot be cancelled");
    }
    return this.prisma.booking.update({
      where: { publicToken },
      data: {
        status: BookingStatus.CANCELLED,
        events: {
          create: {
            eventType: "PUBLIC_BOOKING_CANCELLED",
            payload: "{}",
          },
        },
      },
    });
  }

  async createPublic(dto: CreatePublicBookingDto, meta: { ip?: string; userAgent?: string }) {
    if (dto.website) {
      throw new BadRequestException("Invalid booking request");
    }

    /*
     * En el spa no se acepta direccion. Mas abajo tampoco se guardaria, pero
     * callarselo dejaria pasar peticiones incoherentes y, si alguien quitara esa
     * proteccion al refactorizar, empezariamos a almacenar direcciones que nadie
     * pidio sin que ninguna prueba lo notara.
     */
    if (dto.serviceLocation === ServiceLocation.SPA && dto.address) {
      throw new BadRequestException("No hace falta dirección para atenderte en el spa");
    }

    const existing = await this.prisma.booking.findUnique({
      where: { idempotencyKey: dto.idempotencyKey },
      select: CAMPOS_RESERVA,
    });
    if (existing) {
      return existing;
    }

    await this.prisma.publicBookingAttempt.create({
      data: {
        phone: this.normalizePhone(dto.phone),
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
      },
    });

    // El registro de intentos guarda IP y navegador, que son datos personales.
    // Se purga aqui en vez de con una tarea programada: no hace falta otra
    // dependencia y la tabla solo crece cuando alguien reserva.
    void this.purgarIntentosAntiguos();

    const selectedServices = await this.services.findActiveByIds(dto.serviceIds);
    const totalDurationMinutes = selectedServices.reduce((sum, service) => sum + service.durationMinutes, 0);
    const endTime = addMinutes(dto.startTime, totalDurationMinutes);

    const isAvailable = await this.availability.assertSlotAvailable({
      date: dto.date,
      staffId: dto.staffId,
      durationMinutes: totalDurationMinutes,
      startTime: dto.startTime,
    });
    if (!isAvailable) {
      throw new ConflictException("Selected slot is no longer available");
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const scheduledDate = new Date(`${dto.date}T00:00:00.000Z`);
        const activeBookings = await tx.booking.findMany({
          where: {
            scheduledDate,
            staffId: dto.staffId,
            status: { in: ACTIVE_BOOKING_STATUSES },
          },
        });

        const hasCollision = activeBookings.some((booking) =>
          rangesOverlap(dto.startTime, endTime, booking.startTime, booking.endTime),
        );
        if (hasCollision) {
          throw new ConflictException("Selected slot is no longer available");
        }

        /**
         * El telefono identifica a la clienta.
         *
         * Antes cada reserva creaba un registro nuevo, asi que una clienta con
         * cinco visitas quedaba como cinco personas distintas y su historial
         * era inservible. Si ya existe se reutiliza y se actualiza el nombre
         * con el ultimo que escribio, que corrige errores de tecleo previos.
         *
         * Va dentro de la transaccion, asi que dos reservas simultaneas del
         * mismo telefono no pueden crear dos registros.
         */
        const phone = this.normalizePhone(dto.phone);
        const fullName = dto.clientName.trim();
        const existente = await tx.client.findFirst({ where: { phone }, select: { id: true, fullName: true } });

        const client = existente
          ? await tx.client.update({
              where: { id: existente.id },
              data: existente.fullName === fullName ? {} : { fullName },
              select: { id: true },
            })
          : await tx.client.create({ data: { fullName, phone }, select: { id: true } });

        return tx.booking.create({
          data: {
            publicToken: crypto.randomBytes(24).toString("hex"),
            clientId: client.id,
            staffId: dto.staffId,
            status: BookingStatus.PENDING,
            scheduledDate,
            startTime: dto.startTime,
            endTime,
            totalDurationMinutes,
            notes: dto.notes,
            serviceLocation: dto.serviceLocation,
            // En el spa nunca se guarda direccion, aunque llegue en la peticion.
            address: dto.serviceLocation === ServiceLocation.DOMICILIO ? dto.address?.trim() : null,
            // Evidencia de la autorizacion: cuando la dio y que version acepto.
            consentAcceptedAt: new Date(),
            consentPolicyVersion: POLITICA_DATOS_VERSION,
            source: BookingSource.PUBLIC_WEB,
            idempotencyKey: dto.idempotencyKey,
            services: {
              // El precio no se guarda: cada clienta tiene su tarifa acordada.
              create: selectedServices.map((service) => ({
                serviceId: service.id,
                durationSnapshotMinutes: service.durationMinutes,
                serviceNameSnapshot: service.name,
              })),
            },
            events: {
              create: {
                eventType: "PUBLIC_BOOKING_CREATED",
                payload: JSON.stringify({ serviceIds: dto.serviceIds }),
              },
            },
          },
          select: CAMPOS_RESERVA,
        });
      });
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("Duplicate booking request");
      }
      throw error;
    }
  }

  updateStatus(id: string, status: BookingStatusValue) {
    return this.prisma.booking.update({
      where: { id },
      select: CAMPOS_RESERVA,
      data: {
        status,
        events: {
          create: {
            eventType: "BOOKING_STATUS_UPDATED",
            payload: JSON.stringify({ status }),
          },
        },
      },
    });
  }

  /**
   * Borra los intentos mas viejos que la ventana de retencion.
   *
   * Sirven para investigar abuso reciente; conservarlos indefinidamente seria
   * acumular datos personales sin finalidad. Los fallos no interrumpen la
   * reserva: la limpieza es secundaria frente a atender a la clienta.
   */
  private async purgarIntentosAntiguos() {
    const limite = new Date(Date.now() - RETENCION_INTENTOS_DIAS * 24 * 60 * 60 * 1000);
    try {
      await this.prisma.publicBookingAttempt.deleteMany({ where: { createdAt: { lt: limite } } });
    } catch {
      // Sin efecto sobre la reserva ya creada.
    }
  }

  /**
   * Normaliza a los 10 digitos nacionales.
   *
   * El telefono identifica a la clienta, asi que el mismo numero escrito con y
   * sin indicativo debe producir la misma cadena. Si no, se duplican registros.
   * No depende del formulario: cualquier cliente de la API queda igualado.
   */
  private normalizePhone(phone: string) {
    let digits = phone.replace(/\D/g, "");
    if (digits.length > 10 && digits.startsWith("57")) digits = digits.slice(2);
    return digits;
  }
}
