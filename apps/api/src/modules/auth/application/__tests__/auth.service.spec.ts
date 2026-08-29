import { UnauthorizedException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { AuthService } from "../auth.service";
import type { PrismaService } from "../../../../prisma/prisma.service";
import type { JwtService } from "@nestjs/jwt";

/**
 * Prisma falso para `perfil`.
 *
 * Devuelve siempre la misma fila, que es justo lo que se quiere comprobar: que
 * el metodo lee de la base y no del token.
 */
function prismaFalso(fila: Record<string, unknown> | null) {
  return {
    user: { findUnique: async () => fila },
  } as unknown as PrismaService;
}

const jwtFalso = {} as JwtService;

describe("perfil", () => {
  it("devuelve los datos vigentes de la base, no los del token", async () => {
    // El token se firmo cuando la cuenta se llamaba "Admin Spa"; la base ya
    // dice "Yeri". El panel debe recibir el nombre nuevo.
    const auth = new AuthService(
      prismaFalso({ id: "u1", email: "admin@spa.local", name: "Yeri", role: "OWNER", isActive: true }),
      jwtFalso,
    );

    await expect(auth.perfil("u1")).resolves.toEqual({
      id: "u1",
      email: "admin@spa.local",
      name: "Yeri",
      role: "OWNER",
    });
  });

  it("rechaza la sesion si la cuenta esta desactivada", async () => {
    // Sin esto, un token firmado antes de desactivar la cuenta seguiria
    // abriendo el panel hasta que caduque, doce horas despues.
    const auth = new AuthService(
      prismaFalso({ id: "u1", email: "admin@spa.local", name: "Yeri", role: "OWNER", isActive: false }),
      jwtFalso,
    );

    await expect(auth.perfil("u1")).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rechaza la sesion si la cuenta ya no existe", async () => {
    const auth = new AuthService(prismaFalso(null), jwtFalso);

    await expect(auth.perfil("borrado")).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("no expone el hash de la contrasena", async () => {
    const auth = new AuthService(
      prismaFalso({
        id: "u1",
        email: "admin@spa.local",
        name: "Yeri",
        role: "OWNER",
        isActive: true,
        passwordHash: "$2b$12$comprometido",
      }),
      jwtFalso,
    );

    // La consulta usa `select`, pero el metodo ademas arma el objeto campo a
    // campo: si alguien amplia el select, el hash sigue sin salir por la API.
    expect(await auth.perfil("u1")).not.toHaveProperty("passwordHash");
  });
});
