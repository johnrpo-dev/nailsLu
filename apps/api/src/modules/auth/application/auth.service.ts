import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import bcrypt from "bcrypt";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash || !user.isActive) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      accessToken: await this.jwt.signAsync(payload, {
        secret: process.env.JWT_ACCESS_SECRET,
        /**
         * Sin refresh tokens implementados, 15 minutos obligaria a la dueña a
         * volver a entrar a media jornada. Una sesion de trabajo es mas util.
         *
         * El tipo de `expiresIn` es un literal de plantilla del paquete `ms`
         * ("12h", "7d"...), que una variable de entorno no puede satisfacer en
         * tiempo de compilacion. La asercion es segura porque el valor solo se
         * lee del entorno del servidor, no de entrada de usuario.
         */
        expiresIn: (process.env.JWT_ACCESS_TTL ?? "12h") as `${number}h`,
      }),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }
}
