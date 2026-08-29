import { describe, expect, it } from "vitest";
import { addMinutes, minutesFromTime, rangesOverlap, timeFromMinutes } from "../time.utils";

describe("conversion entre hora y minutos", () => {
  it("convierte en ambos sentidos sin perder informacion", () => {
    for (const hora of ["00:00", "08:30", "13:45", "18:00", "23:59"]) {
      expect(timeFromMinutes(minutesFromTime(hora))).toBe(hora);
    }
  });

  it("rellena con cero a la izquierda", () => {
    expect(timeFromMinutes(minutesFromTime("09:05"))).toBe("09:05");
  });
});

describe("addMinutes", () => {
  it("suma dentro de la misma hora", () => {
    expect(addMinutes("09:00", 45)).toBe("09:45");
  });

  it("cruza la hora correctamente", () => {
    expect(addMinutes("09:30", 45)).toBe("10:15");
  });

  it("permite que un servicio termine despues del cierre", () => {
    // La ultima cita se acepta a las 18:00 aunque el servicio dure 3 horas.
    expect(addMinutes("18:00", 180)).toBe("21:00");
  });
});

describe("rangesOverlap", () => {
  it("detecta solapamiento parcial", () => {
    expect(rangesOverlap("09:00", "10:00", "09:30", "10:30")).toBe(true);
  });

  it("detecta que uno contiene al otro", () => {
    expect(rangesOverlap("09:00", "12:00", "10:00", "11:00")).toBe(true);
  });

  it("no considera solapamiento cuando uno termina donde empieza el otro", () => {
    // Una cita de 09:00 a 10:00 deja libre las 10:00: si no, se perderia una
    // franja entera entre cada reserva.
    expect(rangesOverlap("09:00", "10:00", "10:00", "11:00")).toBe(false);
  });

  it("no considera solapamiento en rangos separados", () => {
    expect(rangesOverlap("09:00", "10:00", "14:00", "15:00")).toBe(false);
  });
});
