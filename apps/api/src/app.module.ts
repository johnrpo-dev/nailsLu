import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { AuthModule } from "./modules/auth/auth.module";
import { AvailabilityModule } from "./modules/availability/availability.module";
import { BookingsModule } from "./modules/bookings/bookings.module";
import { ClientsModule } from "./modules/clients/clients.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { ServicesModule } from "./modules/services/services.module";
import { UsersModule } from "./modules/users/users.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: Number(process.env.PUBLIC_BOOKING_RATE_LIMIT_TTL_SECONDS ?? 60) * 1000,
        limit: Number(process.env.PUBLIC_BOOKING_RATE_LIMIT_MAX ?? 5),
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    ClientsModule,
    ServicesModule,
    AvailabilityModule,
    BookingsModule,
    NotificationsModule,
  ],
})
export class AppModule {}
