import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
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
  reservas?: { startTime: string; endTime: string; travelBufferMinutes?: number }[];
  bloqueos?: { type: string; startTime: string; endTime: string }[];
}) {
  return {
    businessHour: { findMany: async () => datos.horarios ?? [] },
    // El margen de traslado por defecto es 0: sin el, `addMinutes` recibiria
    // undefined y las comparaciones darian NaN, que no falla, solo deja de
    // detectar choques.
    booking: {
      findMany: async () => (datos.reservas ?? []).map((r) => ({ travelBufferMinutes: 0, ...r })),
    },
    availabilityBlock: { findMany: async () => datos.bloqueos ?? [] },
  } as unknown as PrismaService;
}

// 2026-09-08 es martes: coincide con weekday 2.
const MARTES = "2026-09-08";

/*
 * El reloj se fija porque ahora las franjas pasadas no se ofrecen: con la hora
 * real, estas pruebas empezarian a fallar solas al llegar esa fecha.
 * 12:00 UTC son las 07:00 en Bogota, antes de abrir, asi que la jornada entera
 * sigue disponible.
 */
beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-08T12:00:00.000Z"));
});

afterAll(() => {
  vi.useRealTimers();
});
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

describe("no se agenda en el pasado", () => {
  it("deja de ofrecer las franjas que ya empezaron hoy", async () => {
    // El fallo reportado: a las 10:19 seguia ofreciendo las 08:30 del mismo dia.
    vi.setSystemTime(new Date("2026-09-08T15:19:00.000Z")); // 10:19 en Bogota
    const s = new AvailabilityService(prismaFalso({ horarios: jornada }));
    const { slots } = await s.listSlots({ date: MARTES, durationMinutes: 60 });

    expect(slots).not.toContain("08:30");
    expect(slots).not.toContain("10:00");
    expect(slots[0]).toBe("10:30");
    vi.setSystemTime(new Date("2026-09-08T12:00:00.000Z"));
  });

  it("no ofrece la franja que arranca en este mismo minuto", async () => {
    vi.setSystemTime(new Date("2026-09-08T15:30:00.000Z")); // 10:30 clavadas
    const s = new AvailabilityService(prismaFalso({ horarios: jornada }));
    const { slots } = await s.listSlots({ date: MARTES, durationMinutes: 60 });

    expect(slots).not.toContain("10:30");
    expect(slots[0]).toBe("11:00");
    vi.setSystemTime(new Date("2026-09-08T12:00:00.000Z"));
  });

  it("un dia que ya paso no tiene ninguna franja", async () => {
    const s = new AvailabilityService(prismaFalso({ horarios: jornada }));
    const { slots } = await s.listSlots({ date: "2026-09-01", durationMinutes: 60 });

    expect(slots).toEqual([]);
  });

  it("un dia futuro se ofrece entero, sea la hora que sea hoy", async () => {
    // 23:50 en Bogota: el dia de hoy ya no da, pero el martes siguiente si.
    vi.setSystemTime(new Date("2026-09-16T04:50:00.000Z"));
    const s = new AvailabilityService(prismaFalso({ horarios: jornada }));
    const { slots } = await s.listSlots({ date: "2026-09-22", durationMinutes: 60 });

    expect(slots[0]).toBe("08:00");
    expect(slots.at(-1)).toBe("18:00");
    vi.setSystemTime(new Date("2026-09-08T12:00:00.000Z"));
  });

  it("usa la hora de Colombia y no la del servidor", async () => {
    /*
     * 2026-09-09 a las 02:00 UTC son todavia las 21:00 del martes 8 en Bogota.
     * Un servidor en UTC creeria que ya es miercoles y daria el martes por
     * terminado; aqui el martes sigue siendo hoy y sus franjas ya pasaron
     * todas, que es lo correcto.
     */
    vi.setSystemTime(new Date("2026-09-09T02:00:00.000Z"));
    const s = new AvailabilityService(prismaFalso({ horarios: jornada }));

    expect((await s.listSlots({ date: MARTES, durationMinutes: 60 })).slots).toEqual([]);
    vi.setSystemTime(new Date("2026-09-08T12:00:00.000Z"));
  });
});

describe("traslado a domicilio", () => {
  it("una cita a domicilio deja ocupados 50 minutos mas", async () => {
    // Servicio de hora y media a las 10:00: termina a las 11:30 y con el
    // traslado la agenda no se libera hasta las 12:20.
    const s = new AvailabilityService(
      prismaFalso({
        horarios: jornada,
        reservas: [{ startTime: "10:00", endTime: "11:30", travelBufferMinutes: 50 }],
      }),
    );
    const { slots } = await s.listSlots({ date: MARTES, durationMinutes: 60 });

    expect(slots).not.toContain("11:30");
    expect(slots).not.toContain("12:00");
    expect(slots).toContain("12:30");
  });

  it("una cita en el spa libera la agenda al terminar", async () => {
    // El mismo horario sin traslado: a las 11:30 ya se puede empezar otra.
    const s = new AvailabilityService(
      prismaFalso({
        horarios: jornada,
        reservas: [{ startTime: "10:00", endTime: "11:30", travelBufferMinutes: 0 }],
      }),
    );
    const { slots } = await s.listSlots({ date: MARTES, durationMinutes: 60 });

    expect(slots).toContain("11:30");
  });

  it("pedir domicilio descarta franjas que si caben para el spa", async () => {
    const conReserva = {
      horarios: jornada,
      reservas: [{ startTime: "12:00", endTime: "13:00", travelBufferMinutes: 0 }],
    };

    // Un servicio de una hora a las 11:00 termina a las 12:00 justo cuando
    // empieza la siguiente: en el spa cabe.
    const enSpa = await new AvailabilityService(prismaFalso(conReserva)).listSlots({
      date: MARTES,
      durationMinutes: 60,
    });
    expect(enSpa.slots).toContain("11:00");

    // A domicilio ocuparia hasta las 12:50 y se solapa, asi que no se ofrece.
    const aDomicilio = await new AvailabilityService(prismaFalso(conReserva)).listSlots({
      date: MARTES,
      durationMinutes: 60,
      serviceLocation: "DOMICILIO",
    });
    expect(aDomicilio.slots).not.toContain("11:00");
  });

  it("el traslado no recorta la hora de la ultima cita", async () => {
    // El cierre sigue siendo la hora en que se acepta la ultima clienta: que
    // termine a las 20:20 con el viaje incluido no es motivo para no ofrecerla.
    const s = new AvailabilityService(prismaFalso({ horarios: jornada }));
    const { slots } = await s.listSlots({
      date: MARTES,
      durationMinutes: 90,
      serviceLocation: "DOMICILIO",
    });

    expect(slots.at(-1)).toBe("18:00");
  });

  it("el traslado de ida separa la cita anterior", async () => {
    // Cita en el spa de 09:00 a 10:00. Un domicilio a las 10:30 tendria que
    // salir sobre las 09:40, cuando todavia esta atendiendo.
    const s = new AvailabilityService(
      prismaFalso({
        horarios: jornada,
        reservas: [{ startTime: "09:00", endTime: "10:00", travelBufferMinutes: 0 }],
      }),
    );

    const aDomicilio = await s.listSlots({ date: MARTES, durationMinutes: 60, serviceLocation: "DOMICILIO" });
    expect(aDomicilio.slots).not.toContain("10:30");
    expect(aDomicilio.slots).toContain("11:00");

    // La misma cita en el spa si puede empezar a las 10:00, sin viaje de por medio.
    const enSpa = await s.listSlots({ date: MARTES, durationMinutes: 60 });
    expect(enSpa.slots).toContain("10:00");
  });

  it("el traslado de ida no recorta la primera cita del dia", async () => {
    // A la primera se puede salir de casa directamente, asi que abrir a las
    // 08:00 no impide un domicilio a esa misma hora.
    const s = new AvailabilityService(prismaFalso({ horarios: jornada }));
    const { slots } = await s.listSlots({
      date: MARTES,
      durationMinutes: 60,
      serviceLocation: "DOMICILIO",
    });

    expect(slots[0]).toBe("08:00");
  });

  it("restar el traslado nunca produce una hora negativa", async () => {
    // Con la jornada abierta desde medianoche, 00:00 menos 50 minutos se
    // saldria del dia. Se acota en 00:00 en vez de generar "-1:10".
    //
    // Se usa el martes siguiente y no MARTES, que con el reloj fijado es hoy:
    // ahi el filtro de franjas pasadas recortaria la madrugada y taparia justo
    // lo que se quiere comprobar.
    const s = new AvailabilityService(
      prismaFalso({
        horarios: [{ weekday: 2, startTime: "00:00", endTime: "23:30", isActive: true }],
      }),
    );
    const { slots } = await s.listSlots({
      date: "2026-09-15",
      durationMinutes: 60,
      serviceLocation: "DOMICILIO",
    });

    expect(slots[0]).toBe("00:00");
    expect(slots.every((h) => /^\d{2}:\d{2}$/.test(h))).toBe(true);
  });

  it("el traslado tambien cuenta contra un bloqueo de la agenda", async () => {
    // Bloqueo de 13:00 a 14:00: un domicilio de una hora a las 11:30 acabaria
    // ocupando hasta las 13:20 y se cruza con el.
    const s = new AvailabilityService(
      prismaFalso({
        horarios: jornada,
        bloqueos: [{ type: "BLOCKED", startTime: "13:00", endTime: "14:00" }],
      }),
    );
    const { slots } = await s.listSlots({
      date: MARTES,
      durationMinutes: 60,
      serviceLocation: "DOMICILIO",
    });

    expect(slots).not.toContain("11:30");
    expect(slots).toContain("11:00");
  });
});

describe("festivos", () => {
  it("un festivo no ofrece ninguna franja aunque el horario este abierto", async () => {
    // 25 de diciembre de 2026, viernes: dia laborable segun el horario semanal.
    const s = new AvailabilityService(
      prismaFalso({ horarios: [{ weekday: 5, startTime: "08:00", endTime: "18:00", isActive: true }] }),
    );
    const { slots, holiday } = await s.listSlots({ date: "2026-12-25", durationMinutes: 60 });

    expect(slots).toHaveLength(0);
    expect(holiday).toBe("Navidad");
  });

  it("abrir el festivo a mano vale, y solo por las horas indicadas", async () => {
    // Si decide trabajar la manana del 25, se ofrece esa manana y nada mas: no
    // se recupera la jornada completa del horario semanal.
    const s = new AvailabilityService(
      prismaFalso({
        horarios: [{ weekday: 5, startTime: "08:00", endTime: "18:00", isActive: true }],
        bloqueos: [{ type: "AVAILABLE", startTime: "09:00", endTime: "12:00" }],
      }),
    );
    const { slots } = await s.listSlots({ date: "2026-12-25", durationMinutes: 60 });

    expect(slots[0]).toBe("09:00");
    expect(slots.at(-1)).toBe("12:00");
  });

  it("el dia siguiente a un festivo es normal", async () => {
    const s = new AvailabilityService(
      prismaFalso({ horarios: [{ weekday: 6, startTime: "08:00", endTime: "14:00", isActive: true }] }),
    );
    const { slots, holiday } = await s.listSlots({ date: "2026-12-26", durationMinutes: 60 });

    expect(holiday).toBeNull();
    expect(slots.length).toBeGreaterThan(0);
  });

  it("cierra el festivo trasladado, no la fecha original", async () => {
    const jornadaLunes = [{ weekday: 1, startTime: "08:00", endTime: "18:00", isActive: true }];
    const s = new AvailabilityService(prismaFalso({ horarios: jornadaLunes }));

    // Reyes cae el martes 6 de enero de 2026 y se celebra el lunes 12.
    const celebrado = await s.listSlots({ date: "2026-01-12", durationMinutes: 60 });
    expect(celebrado.slots).toHaveLength(0);
    expect(celebrado.holiday).toBe("Reyes Magos");
  });
});
