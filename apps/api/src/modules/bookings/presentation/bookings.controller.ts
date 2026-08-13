import { Body, Controller, Get, Headers, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { Request } from "express";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { BookingsService } from "../application/bookings.service";
import { CreatePublicBookingDto } from "./dto/create-public-booking.dto";
import { ListBookingsQueryDto } from "./dto/list-bookings-query.dto";
import { UpdateBookingStatusDto } from "./dto/update-booking-status.dto";

@Controller()
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  // Limite estricto del formulario publico, configurable por entorno.
  @Throttle({
    default: {
      limit: Number(process.env.PUBLIC_BOOKING_RATE_LIMIT_MAX ?? 5),
      ttl: Number(process.env.PUBLIC_BOOKING_RATE_LIMIT_TTL_SECONDS ?? 60) * 1000,
    },
  })
  @Post("public/bookings")
  createPublic(
    @Body() dto: CreatePublicBookingDto,
    @Req() request: Request,
    @Headers("user-agent") userAgent?: string,
  ) {
    return this.bookings.createPublic(dto, {
      ip: request.ip,
      userAgent,
    });
  }

  @Get("public/bookings/:publicToken/status")
  getPublicStatus(@Param("publicToken") publicToken: string) {
    return this.bookings.getPublicStatus(publicToken);
  }

  @Post("public/bookings/:publicToken/cancel")
  cancelPublic(@Param("publicToken") publicToken: string) {
    return this.bookings.cancelPublic(publicToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get("admin/bookings")
  listAdmin(@Query() query: ListBookingsQueryDto) {
    return this.bookings.listAdmin(query);
  }

  @UseGuards(JwtAuthGuard)
  @Patch("admin/bookings/:id/status")
  updateStatus(@Param("id") id: string, @Body() dto: UpdateBookingStatusDto) {
    return this.bookings.updateStatus(id, dto.status);
  }
}
