import { describe, expect, it } from "vitest";
import { diasDelMes, esDelMes, moverMes, resumenDeCitas, tituloMes } from "../mes";

describe("diasDelMes", () => {
  it("siempre devuelve seis semanas", () => {
    for (let mes = 0; mes < 12; mes += 1) {
      expect(diasDelMes(2026, mes)).toHaveLength(42);
    }
  });

  it("empieza en el domingo anterior al dia 1", () => {
    // El 1 de septiembre de 2026 es martes: la cuadricula arranca el domingo
    // 30 de agosto, igual que en la captura de Google Calendar.
    const dias = diasDelMes(2026, 8);
    expect(dias[0]).toBe("2026-08-30");
    expect(dias[2]).toBe("2026-09-01");
  });

  it("si el dia 1 ya es domingo, empieza ese mismo dia", () => {
    // 1 de noviembre de 2026: domingo.
    expect(diasDelMes(2026, 10)[0]).toBe("2026-11-01");
  });

  it("los dias son consecutivos, sin saltos ni repeticiones", () => {
    const dias = diasDelMes(2026, 2); // marzo, con cambio de horario en otros paises
    for (let i = 1; i < dias.length; i += 1) {
      const anterior = new Date(`${dias[i - 1]}T00:00:00.000Z`).getTime();
      const actual = new Date(`${dias[i]}T00:00:00.000Z`).getTime();
      expect(actual - anterior).toBe(24 * 60 * 60 * 1000);
    }
  });

  it("cruza de ano correctamente", () => {
    const dias = diasDelMes(2026, 11); // diciembre
    expect(dias).toContain("2026-12-31");
    expect(dias.at(-1)?.startsWith("2027-01")).toBe(true);
  });
});

describe("moverMes", () => {
  it("avanza y retrocede cruzando el ano", () => {
    expect(moverMes(2026, 11, 1)).toEqual({ ano: 2027, mes: 0 });
    expect(moverMes(2027, 0, -1)).toEqual({ ano: 2026, mes: 11 });
    expect(moverMes(2026, 8, 1)).toEqual({ ano: 2026, mes: 9 });
  });
});

describe("tituloMes y esDelMes", () => {
  it("nombra el mes en espanol", () => {
    expect(tituloMes(2026, 8)).toBe("septiembre 2026");
  });

  it("distingue los dias de los meses vecinos", () => {
    expect(esDelMes("2026-09-15", 2026, 8)).toBe(true);
    expect(esDelMes("2026-08-30", 2026, 8)).toBe(false);
  });
});

describe("resumenDeCitas", () => {
  it("un dia libre de verdad", () => {
    expect(resumenDeCitas(0, 0)).toBe("sin citas");
  });

  it("concuerda en singular y plural", () => {
    expect(resumenDeCitas(1, 0)).toBe("1 cita");
    expect(resumenDeCitas(3, 0)).toBe("3 citas");
  });

  /*
   * El caso que motivo el helper: antes la etiqueta solo contaba las activas y
   * este dia se anunciaba "sin citas" mientras la casilla mostraba dos chips
   * tachados.
   */
  it("nombra las canceladas de un dia sin citas activas", () => {
    expect(resumenDeCitas(0, 2)).toBe("sin citas, 2 canceladas");
    expect(resumenDeCitas(0, 1)).toBe("sin citas, 1 cancelada");
  });

  it("suma las canceladas a las activas", () => {
    expect(resumenDeCitas(2, 1)).toBe("2 citas, 1 cancelada");
  });
});
