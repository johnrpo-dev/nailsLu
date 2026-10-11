import { BadRequestException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { FECHA_ISO, fechaUtc } from "../fechas";

describe("fechaUtc", () => {
  it("convierte un dia en su medianoche UTC", () => {
    expect(fechaUtc("2026-08-30").toISOString()).toBe("2026-08-30T00:00:00.000Z");
  });

  it("acepta el primero y el ultimo dia del ano", () => {
    expect(fechaUtc("2026-01-01").toISOString()).toBe("2026-01-01T00:00:00.000Z");
    expect(fechaUtc("2026-12-31").toISOString()).toBe("2026-12-31T00:00:00.000Z");
  });

  it("acepta el 29 de febrero de un ano bisiesto", () => {
    expect(fechaUtc("2028-02-29").toISOString()).toBe("2028-02-29T00:00:00.000Z");
  });

  /*
   * Los cuatro casos que `@IsDateString()` deja pasar por si solo. Los dos
   * primeros acababan en Prisma como un 500; el tercero es el peligroso, porque
   * JS rueda el 31 de febrero al 3 de marzo y la consulta respondia con otro
   * rango sin quejarse.
   */
  it("rechaza una fecha con hora", () => {
    expect(() => fechaUtc("2026-08-30T12:00:00.000Z")).toThrow(BadRequestException);
  });

  it("rechaza el formato basico sin guiones", () => {
    expect(() => fechaUtc("20260830")).toThrow(BadRequestException);
  });

  it("rechaza un dia que no existe en ese mes", () => {
    expect(() => fechaUtc("2026-02-31")).toThrow(BadRequestException);
    expect(() => fechaUtc("2026-04-31")).toThrow(BadRequestException);
    // 2026 no es bisiesto.
    expect(() => fechaUtc("2026-02-29")).toThrow(BadRequestException);
  });

  it("rechaza un mes que no existe", () => {
    expect(() => fechaUtc("2026-13-01")).toThrow(BadRequestException);
  });

  it("rechaza texto vacio o sin forma de fecha", () => {
    for (const malo of ["", "hoy", "2026-8-3", "2026/08/30"]) {
      expect(() => fechaUtc(malo)).toThrow(BadRequestException);
    }
  });
});

describe("FECHA_ISO", () => {
  /*
   * El regex solo fija la forma: lo usan los DTO para rechazar en el borde con
   * un mensaje por campo. Que el dia exista lo comprueba `fechaUtc`, y por eso
   * los DTO llevan los dos y no uno u otro.
   */
  it("acepta la forma YYYY-MM-DD y nada mas", () => {
    expect(FECHA_ISO.test("2026-08-30")).toBe(true);
    expect(FECHA_ISO.test("2026-08-30T12:00:00.000Z")).toBe(false);
    expect(FECHA_ISO.test("20260830")).toBe(false);
    expect(FECHA_ISO.test("2026-8-3")).toBe(false);
  });

  it("no comprueba que el dia exista, a diferencia de fechaUtc", () => {
    expect(FECHA_ISO.test("2026-02-31")).toBe(true);
  });
});
