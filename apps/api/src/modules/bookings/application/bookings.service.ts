import { BadRequestException, ConflictException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import crypto from "node:crypto";
import {
  ACTIVE_BOOKING_STATUSES,
  BookingSource,
  BookingStatus,
  type BookingStatus as BookingStatusValue,
} from "../../../common/enums";
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

        const client = await tx.client.create({
          data: {
            fullName: dto.clientName.trim(),
            phone: this.normalizePhone(dto.phone),
          },
        });

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

  private normalizePhone(phone: string) {
    return phone.replace(/[^\d+]/g, "");
  }
}
