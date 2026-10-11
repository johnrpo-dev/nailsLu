import { describe, expect, it } from "vitest";
import { createRollingDays, formatLongDate, msHastaProximaMedianoche, toLocalIsoDate } from "../date";

describe("toLocalIsoDate", () => {
  it("usa la fecha del reloj local, no la de UTC", () => {
    // En Colombia (UTC-5) a las 21:00 del 11 de agosto, en UTC ya es dia 12.
    // Con toISOString la agenda marcaba manana como hoy.
    const nocheEnColombia = new Date(2026, 7, 11, 21, 30);
    expect(toLocalIsoDate(nocheEnColombia)).toBe("2026-08-11");
  });

  it("rellena mes y dia con cero", () => {
    expect(toLocalIsoDate(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("respeta el ultimo instante del dia", () => {
    expect(toLocalIsoDate(new Date(2026, 11, 31, 23, 59, 59))).toBe("2026-12-31");
  });
});

describe("createRollingDays", () => {
  it("devuelve la cantidad pedida empezando por hoy", () => {
    const dias = createRollingDays(14, new Date(2026, 7, 11));
    expect(dias).toHaveLength(14);
    expect(dias[0].iso).toBe("2026-08-11");
    expect(dias[0].isToday).toBe(true);
  });

  it("avanza un dia por posicion y cruza el fin de mes", () => {
    const dias = createRollingDays(3, new Date(2026, 7, 30));
    expect(dias.map((d) => d.iso)).toEqual(["2026-08-30", "2026-08-31", "2026-09-01"]);
  });

  it("solo marca hoy en la primera posicion", () => {
    const dias = createRollingDays(5, new Date(2026, 7, 11));
    expect(dias.filter((d) => d.isToday)).toHaveLength(1);
  });
});

describe("formatLongDate", () => {
  it("interpreta la fecha en local y no se corre un dia", () => {
    // Con new Date("2026-08-11") se interpreta como UTC y en Colombia
    // mostraria el 10 de agosto.
    expect(formatLongDate("2026-08-11")).toContain("11");
    expect(formatLongDate("2026-08-11")).toContain("agosto");
  });
});

describe("msHastaProximaMedianoche", () => {
  const HORA = 60 * 60 * 1000;

  it("cuenta lo que falta para el dia siguiente", () => {
    expect(msHastaProximaMedianoche(new Date(2026, 7, 11, 23, 0, 0))).toBe(HORA);
    expect(msHastaProximaMedianoche(new Date(2026, 7, 11, 21, 30, 0))).toBe(2.5 * HORA);
  });

  it("en la medianoche cuenta el dia entero, no cero", () => {
    // Devolver cero haria girar el temporizador sin parar.
    expect(msHastaProximaMedianoche(new Date(2026, 7, 11, 0, 0, 0))).toBe(24 * HORA);
  });

  it("cruza el fin de mes y el fin de ano", () => {
    expect(msHastaProximaMedianoche(new Date(2026, 7, 31, 23, 0, 0))).toBe(HORA);
    expect(msHastaProximaMedianoche(new Date(2026, 11, 31, 23, 0, 0))).toBe(HORA);
  });

  it("siempre es positivo, a cualquier hora del ano", () => {
    for (let mes = 0; mes < 12; mes += 1) {
      for (const hora of [0, 1, 6, 12, 18, 23]) {
        expect(msHastaProximaMedianoche(new Date(2026, mes, 15, hora, 17, 42))).toBeGreaterThan(0);
      }
    }
  });
});
