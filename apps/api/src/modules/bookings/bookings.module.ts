import { Module } from "@nestjs/common";
import { AvailabilityModule } from "../availability/availability.module";
import { ServicesModule } from "../services/services.module";
import { BookingsService } from "./application/bookings.service";
import { BookingsController } from "./presentation/bookings.controller";

@Module({
  imports: [AvailabilityModule, ServicesModule],
  controllers: [BookingsController],
  providers: [BookingsService],
})
export class BookingsModule {}
