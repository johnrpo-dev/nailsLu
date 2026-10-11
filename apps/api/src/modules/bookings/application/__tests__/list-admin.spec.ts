import { BadRequestException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { BookingsService } from "../bookings.service";
import { ACTIVE_BOOKING_STATUSES } from "../../../../common/enums";
import { fechaUtc } from "../../../../common/fechas";
import { todayIsoDate } from "../../../availability/application/time.utils";
import type { PrismaService } from "../../../../prisma/prisma.service";
import type { AvailabilityService } from "../../../availability/application/availability.service";
import type { ServicesService } from "../../../services/application/services.service";

type Consulta = {
  where: { status?: { in: readonly string[] }; scheduledDate?: unknown };
  orderBy: { scheduledDate?: string }[];
};

/**
 * Prisma falso que guarda la consulta en vez de ejecutarla.
 *
 * Lo que se prueba aqui es la traduccion de los parametros del panel a un
 * `where`, que es donde estaban los fallos; que la base responda es otra cosa.
 */
function montar() {
  const consultas: Consulta[] = [];
  const prisma = {
    booking: {
      findMany: async (args: Consulta) => {
        consultas.push(args);
        return [];
      },
    },
  } as unknown as PrismaService;

  return {
    consultas,
    servicio: new BookingsService(prisma, {} as AvailabilityService, {} as ServicesService),
  };
}

const ordenFecha = (c: Consulta) => c.orderBy[0]?.scheduledDate;

describe("listAdmin: filtro por estado", () => {
  it("por defecto solo trae las que ocupan agenda", async () => {
    const { servicio, consultas } = montar();
    await servicio.listAdmin();

    expect(consultas[0]?.where.status).toEqual({ in: ACTIVE_BOOKING_STATUSES });
  });

  it("con `all` no filtra el estado, para poder ver el historico", async () => {
    const { servicio, consultas } = montar();
    await servicio.listAdmin({ scope: "all" });

    expect(consultas[0]?.where.status).toBeUndefined();
  });
});

describe("listAdmin: filtro por fecha", () => {
  it("`today` fija el dia de hoy en el salon", async () => {
    const { servicio, consultas } = montar();
    await servicio.listAdmin({ scope: "today" });

    expect(consultas[0]?.where.scheduledDate).toEqual(fechaUtc(todayIsoDate()));
  });

  it("`date` fija ese dia", async () => {
    const { servicio, consultas } = montar();
    await servicio.listAdmin({ date: "2026-09-15" });

    expect(consultas[0]?.where.scheduledDate).toEqual(new Date("2026-09-15T00:00:00.000Z"));
  });

  it("`from`/`to` arma un rango con los dos extremos incluidos", async () => {
    const { servicio, consultas } = montar();
    await servicio.listAdmin({ scope: "all", from: "2026-08-30", to: "2026-10-10" });

    expect(consultas[0]?.where.scheduledDate).toEqual({
      gte: new Date("2026-08-30T00:00:00.000Z"),
      lte: new Date("2026-10-10T00:00:00.000Z"),
    });
  });

  it("acepta un extremo solo", async () => {
    const { servicio, consultas } = montar();
    await servicio.listAdmin({ from: "2026-08-30" });

    expect(consultas[0]?.where.scheduledDate).toEqual({ gte: new Date("2026-08-30T00:00:00.000Z") });
  });

  /*
   * Antes las tres ramas escribian sobre `where.scheduledDate` y ganaba la
   * ultima, asi que esta consulta devolvia el rango entero creyendo pedir hoy.
   */
  it("rechaza combinar un dia con un rango", () => {
    const { servicio } = montar();
    expect(() => servicio.listAdmin({ scope: "today", from: "2020-01-01", to: "2030-01-01" })).toThrow(
      BadRequestException,
    );
    expect(() => servicio.listAdmin({ date: "2026-09-15", to: "2026-10-10" })).toThrow(BadRequestException);
    expect(() => servicio.listAdmin({ scope: "today", date: "2026-09-15" })).toThrow(BadRequestException);
  });

  it("rechaza una fecha que no existe en vez de rodarla al mes siguiente", () => {
    const { servicio } = montar();
    expect(() => servicio.listAdmin({ from: "2026-02-31" })).toThrow(BadRequestException);
  });

  it("no llega a consultar la base cuando los filtros se contradicen", () => {
    const { servicio, consultas } = montar();
    expect(() => servicio.listAdmin({ scope: "today", from: "2026-01-01" })).toThrow(BadRequestException);

    expect(consultas).toHaveLength(0);
  });
});

describe("listAdmin: orden", () => {
  it("las activas, de la mas proxima a la mas lejana", async () => {
    const { servicio, consultas } = montar();
    await servicio.listAdmin();

    expect(ordenFecha(consultas[0]!)).toBe("asc");
  });

  it("el historico, de la mas reciente hacia atras", async () => {
    const { servicio, consultas } = montar();
    await servicio.listAdmin({ scope: "all" });

    expect(ordenFecha(consultas[0]!)).toBe("desc");
  });

  /*
   * El calendario pinta el mes de arriba abajo, asi que un rango manda el
   * orden natural aunque el scope sea `all`. Antes solo se miraba `from`, asi
   * que pedir solo `to` devolvia el mes al reves.
   */
  it("un rango manda el orden natural, con cualquier extremo", async () => {
    for (const rango of [
      { from: "2026-08-30", to: "2026-10-10" },
      { from: "2026-08-30" },
      { to: "2026-10-10" },
    ]) {
      const { servicio, consultas } = montar();
      await servicio.listAdmin({ scope: "all", ...rango });

      expect(ordenFecha(consultas[0]!)).toBe("asc");
    }
  });

  it("un dia concreto tambien manda el orden natural", async () => {
    const { servicio, consultas } = montar();
    await servicio.listAdmin({ scope: "all", date: "2026-09-15" });

    expect(ordenFecha(consultas[0]!)).toBe("asc");
  });
});
