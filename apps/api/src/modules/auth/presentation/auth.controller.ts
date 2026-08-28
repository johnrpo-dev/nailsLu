import { Body, Controller, Get, Patch, Post, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { AuthenticatedUser } from "../../../common/types/authenticated-user";
import { AuthService } from "../application/auth.service";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { LoginDto } from "./dto/login.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // Freno a la fuerza bruta: 10 intentos cada 5 minutos por IP.
  @Throttle({ default: { limit: 10, ttl: 300_000 } })
  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }

  // Mismo freno que el login: cambiar la contrasena exige la actual, asi que
  // es otro punto donde se podria probar a ciegas.
  @Throttle({ default: { limit: 10, ttl: 300_000 } })
  @UseGuards(JwtAuthGuard)
  @Patch("password")
  changePassword(@CurrentUser() user: AuthenticatedUser, @Body() dto: ChangePasswordDto) {
    return this.auth.changePassword(user.sub, dto.currentPassword, dto.newPassword);
  }
}
