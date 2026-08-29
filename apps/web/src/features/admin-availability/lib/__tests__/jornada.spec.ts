import { describe, expect, it } from "vitest";
import { JORNADA_POR_DEFECTO, jornadaDe } from "../jornada";
import type { BusinessHour } from "../../services/availability-admin-api";

/** El horario real del salon: lunes a viernes 8-18 y sabado 8-14. */
const SEMANA = [
  { weekday: 1, startTime: "08:00", endTime: "18:00", isActive: true },
  { weekday: 2, startTime: "08:00", endTime: "18:00", isActive: true },
  { weekday: 3, startTime: "08:00", endTime: "18:00", isActive: true },
  { weekday: 4, startTime: "08:00", endTime: "18:00", isActive: true },
  { weekday: 5, startTime: "08:00", endTime: "18:00", isActive: true },
  { weekday: 6, startTime: "08:00", endTime: "14:00", isActive: true },
] as BusinessHour[];

// 2026-09-01 es martes; 2026-09-05 sabado; 2026-09-06 domingo.
const MARTES = "2026-09-01";
const SABADO = "2026-09-05";
const DOMINGO = "2026-09-06";

describe("jornadaDe", () => {
  it("copia el horario del dia, no la medianoche", () => {
    // El fallo de partida: "todo el dia" abria de 00:00 a 23:59 y ofrecia
    // citas de madrugada.
    expect(jornadaDe(MARTES, SEMANA)).toEqual({ inicio: "08:00", fin: "18:00" });
  });

  it("respeta que el sabado cierra antes", () => {
    expect(jornadaDe(SABADO, SEMANA)).toEqual({ inicio: "08:00", fin: "14:00" });
  });

  it("en un dia cerrado toma el rango mas amplio de la semana", () => {
    // Abrir un domingo suelto: no hay horario que copiar, pero lo esperable es
    // trabajar las horas de siempre.
    expect(jornadaDe(DOMINGO, SEMANA)).toEqual({ inicio: "08:00", fin: "18:00" });
  });

  it("ignora los dias desactivados al buscar el rango", () => {
    const conSabadoCerrado = [
      { weekday: 1, startTime: "09:00", endTime: "17:00", isActive: true },
      { weekday: 6, startTime: "06:00", endTime: "23:00", isActive: false },
    ] as BusinessHour[];

    // El sabado desactivado no debe ampliar la jornada de un domingo.
    expect(jornadaDe(DOMINGO, conSabadoCerrado)).toEqual({ inicio: "09:00", fin: "17:00" });
  });

  it("une dos tramos del mismo dia", () => {
    // Manana y tarde con pausa: toda la jornada va del primer inicio al ultimo fin.
    const partido = [
      { weekday: 2, startTime: "08:00", endTime: "12:00", isActive: true },
      { weekday: 2, startTime: "15:00", endTime: "19:00", isActive: true },
    ] as BusinessHour[];

    expect(jornadaDe(MARTES, partido)).toEqual({ inicio: "08:00", fin: "19:00" });
  });

  it("cae al valor por defecto si no hay ningun horario", () => {
    expect(jornadaDe(MARTES, [])).toEqual(JORNADA_POR_DEFECTO);
  });
});
