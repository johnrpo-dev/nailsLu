import { Injectable } from "@nestjs/common";
import { ACTIVE_BOOKING_STATUSES } from "../../../common/enums";
import { PrismaService } from "../../../prisma/prisma.service";
import { addMinutes, minutesFromTime, rangesOverlap, timeFromMinutes } from "./time.utils";

type AvailabilityQuery = {
  date: string;
  durationMinutes: number;
  staffId?: string;
};

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  async listSlots(query: AvailabilityQuery) {
    const date = new Date(`${query.date}T00:00:00.000Z`);
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

    const slots: string[] = [];
    for (const hours of businessHours) {
      for (
        let cursor = minutesFromTime(hours.startTime);
        cursor + query.durationMinutes <= minutesFromTime(hours.endTime);
        cursor += 30
      ) {
        const startTime = timeFromMinutes(cursor);
        const endTime = addMinutes(startTime, query.durationMinutes);
        const collidesWithBooking = bookings.some((booking) =>
          rangesOverlap(startTime, endTime, booking.startTime, booking.endTime),
        );
        const collidesWithBlock = blocks.some(
          (block) => block.type === "BLOCKED" && rangesOverlap(startTime, endTime, block.startTime, block.endTime),
        );

        if (!collidesWithBooking && !collidesWithBlock) {
          slots.push(startTime);
        }
      }
    }

    return { date: query.date, durationMinutes: query.durationMinutes, slots };
  }

  async assertSlotAvailable(query: AvailabilityQuery & { startTime: string; ignoreBookingId?: string }) {
    const slots = await this.listSlots(query);
    if (!slots.slots.includes(query.startTime)) {
      return false;
    }

    return true;
  }
}
