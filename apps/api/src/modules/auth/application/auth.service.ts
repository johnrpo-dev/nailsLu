import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import bcrypt from "bcrypt";
import { CONTRASENA_POR_DEFECTO } from "../../../common/default-password";
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
      /**
       * El panel avisa mientras siga la contrasena del archivo de datos
       * iniciales, que esta publicada. Se compara con la que acaba de escribir,
       * asi no hace falta guardar ninguna marca en la base.
       */
      usingDefaultPassword: password === CONTRASENA_POR_DEFECTO,
    };
  }

  /**
   * Datos vigentes de la cuenta, leidos de la base.
   *
   * El token guarda correo y rol tal como estaban al entrar, asi que servirlos
   * de vuelta seria repetirle al panel lo que el mismo ya tiene. Consultando la
   * base, cualquier cambio posterior (el nombre, el rol, una cuenta
   * desactivada) surte efecto sin esperar a que caduquen las 12 horas.
   */
  async perfil(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });

    // Cuenta borrada o desactivada con la sesion abierta: el 401 hace que el
    // panel vuelva al login, en vez de dejarla dentro con un token todavia
    // valido por firma.
    if (!user?.isActive) throw new UnauthorizedException("La sesión ya no es válida");

    return { id: user.id, email: user.email, name: user.name, role: user.role };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.passwordHash) {
      throw new UnauthorizedException("Usuario no encontrado");
    }

    const valida = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valida) {
      throw new UnauthorizedException("La contraseña actual no es correcta");
    }

    if (newPassword === CONTRASENA_POR_DEFECTO) {
      throw new BadRequestException("Esa contraseña es la de ejemplo y es publica. Elige otra.");
    }
    if (newPassword === currentPassword) {
      throw new BadRequestException("La contraseña nueva debe ser distinta de la actual");
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await bcrypt.hash(newPassword, 12) },
    });

    return { ok: true };
  }
}
