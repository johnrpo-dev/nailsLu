import { describe, expect, it } from "vitest";
import { AvailabilityService } from "../availability.service";
import type { PrismaService } from "../../../../prisma/prisma.service";

/**
 * Prisma falso.
 *
 * El calculo de franjas es la logica mas delicada del sistema: si sobra una
 * franja se produce un choque de citas, y si falta se pierde una reserva. Se
 * prueba contra datos en memoria para poder cubrir los casos limite sin base.
 */
function prismaFalso(datos: {
  horarios?: { weekday: number; startTime: string; endTime: string; isActive: boolean }[];
  reservas?: { startTime: string; endTime: string }[];
  bloqueos?: { type: string; startTime: string; endTime: string }[];
}) {
  return {
    businessHour: { findMany: async () => datos.horarios ?? [] },
    booking: { findMany: async () => datos.reservas ?? [] },
    availabilityBlock: { findMany: async () => datos.bloqueos ?? [] },
  } as unknown as PrismaService;
}

// 2026-09-08 es martes: coincide con weekday 2.
const MARTES = "2026-09-08";
const jornada = [{ weekday: 2, startTime: "08:00", endTime: "18:00", isActive: true }];

describe("listSlots", () => {
  it("ofrece franjas cada 30 minutos entre la primera y la ultima cita", async () => {
    const s = new AvailabilityService(prismaFalso({ horarios: jornada }));
    const { slots } = await s.listSlots({ date: MARTES, durationMinutes: 60 });

    expect(slots[0]).toBe("08:00");
    expect(slots.at(-1)).toBe("18:00");
    expect(slots).toContain("08:30");
  });

  it("la ultima franja no depende de la duracion del servicio", async () => {
    // El cierre es la hora de la ultima cita, no el fin de la jornada: un
    // servicio largo puede empezar a las 18:00 y terminar despues.
    const s = new AvailabilityService(prismaFalso({ horarios: jornada }));

    for (const durationMinutes of [45, 60, 120, 180]) {
      const { slots } = await s.listSlots({ date: MARTES, durationMinutes });
      expect(slots.at(-1)).toBe("18:00");
    }
  });

  it("no ofrece nada un dia sin horario", async () => {
    const s = new AvailabilityService(prismaFalso({ horarios: [] }));
    const { slots } = await s.listSlots({ date: MARTES, durationMinutes: 60 });
    expect(slots).toHaveLength(0);
  });

  it("retira las franjas que chocan con una reserva existente", async () => {
    const s = new AvailabilityService(
      prismaFalso({ horarios: jornada, reservas: [{ startTime: "10:00", endTime: "11:00" }] }),
    );
    const { slots } = await s.listSlots({ date: MARTES, durationMinutes: 60 });

    expect(slots).not.toContain("10:00");
    expect(slots).not.toContain("09:30"); // terminaria a las 10:30
    expect(slots).toContain("09:00"); // termina justo a las 10:00
    expect(slots).toContain("11:00"); // empieza justo al terminar
  });

  it("retira mas franjas cuanto mas largo es el servicio", async () => {
    const prisma = prismaFalso({ horarios: jornada, reservas: [{ startTime: "15:00", endTime: "16:00" }] });
    const s = new AvailabilityService(prisma);

    const corto = await s.listSlots({ date: MARTES, durationMinutes: 30 });
    const largo = await s.listSlots({ date: MARTES, durationMinutes: 180 });

    expect(corto.slots).toContain("14:30");
    expect(largo.slots).not.toContain("14:30"); // invadiria la reserva
  });

  it("respeta un bloqueo de la manicurista", async () => {
    const s = new AvailabilityService(
      prismaFalso({ horarios: jornada, bloqueos: [{ type: "BLOCKED", startTime: "15:00", endTime: "16:00" }] }),
    );
    const { slots } = await s.listSlots({ date: MARTES, durationMinutes: 60 });

    expect(slots).not.toContain("15:00");
    expect(slots).not.toContain("14:30");
    expect(slots).toContain("16:00");
  });

  it("un bloqueo de dia completo deja la agenda vacia", async () => {
    const s = new AvailabilityService(
      prismaFalso({ horarios: jornada, bloqueos: [{ type: "BLOCKED", startTime: "00:00", endTime: "23:59" }] }),
    );
    const { slots } = await s.listSlots({ date: MARTES, durationMinutes: 60 });
    expect(slots).toHaveLength(0);
  });

  it("una excepcion AVAILABLE abre un dia normalmente cerrado", async () => {
    const s = new AvailabilityService(
      prismaFalso({ horarios: [], bloqueos: [{ type: "AVAILABLE", startTime: "10:00", endTime: "14:00" }] }),
    );
    const { slots } = await s.listSlots({ date: MARTES, durationMinutes: 60 });

    expect(slots[0]).toBe("10:00");
    expect(slots.at(-1)).toBe("14:00");
  });

  it("no repite franjas cuando dos ventanas se solapan", async () => {
    const s = new AvailabilityService(
      prismaFalso({
        horarios: jornada,
        bloqueos: [{ type: "AVAILABLE", startTime: "09:00", endTime: "12:00" }],
      }),
    );
    const { slots } = await s.listSlots({ date: MARTES, durationMinutes: 60 });

    expect(new Set(slots).size).toBe(slots.length);
    expect([...slots]).toEqual([...slots].sort());
  });
});

describe("assertSlotAvailable", () => {
  it("acepta una hora que esta en la lista", async () => {
    const s = new AvailabilityService(prismaFalso({ horarios: jornada }));
    await expect(s.assertSlotAvailable({ date: MARTES, durationMinutes: 60, startTime: "10:00" })).resolves.toBe(true);
  });

  it("rechaza una hora despues de la ultima cita", async () => {
    const s = new AvailabilityService(prismaFalso({ horarios: jornada }));
    await expect(s.assertSlotAvailable({ date: MARTES, durationMinutes: 60, startTime: "18:30" })).resolves.toBe(false);
  });

  it("rechaza una hora fuera de la grilla de 30 minutos", async () => {
    const s = new AvailabilityService(prismaFalso({ horarios: jornada }));
    await expect(s.assertSlotAvailable({ date: MARTES, durationMinutes: 60, startTime: "10:15" })).resolves.toBe(false);
  });
});
