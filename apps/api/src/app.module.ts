import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
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
    /**
     * Limite general holgado: cubre navegacion normal y el panel, que consulta
     * la agenda con frecuencia. Los endpoints sensibles (crear reserva, login)
     * aprietan la tuerca con su propio `@Throttle`.
     */
    ThrottlerModule.forRoot([{ name: "default", ttl: 60_000, limit: 120 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    ClientsModule,
    ServicesModule,
    AvailabilityModule,
    BookingsModule,
    NotificationsModule,
  ],
  providers: [
    /**
     * Sin este proveedor NestJS nunca ejecuta el guard y los `@Throttle` de los
     * controladores son decorativos: el endpoint publico aceptaba peticiones
     * ilimitadas pese a que el README prometia rate limiting.
     */
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
