import { describe, expect, it } from "vitest";
import { festivoDe, festivosDe } from "../festivos-colombia";

describe("festivos de Colombia", () => {
  it("son dieciocho al año", () => {
    for (const ano of [2026, 2027, 2028, 2029]) {
      expect(festivosDe(ano).size).toBe(18);
    }
  });

  it("dos celebraciones que caen el mismo dia son un solo festivo", () => {
    /*
     * En 2030 el 29 de junio es sabado, asi que San Pedro y San Pablo se corre
     * al lunes 1 de julio, que es justo el dia del Sagrado Corazon. Son dos
     * celebraciones pero un unico dia no laborable, y para cerrar el salon eso
     * es lo que cuenta.
     */
    expect(festivosDe(2030).size).toBe(17);
    expect(festivoDe("2030-07-01")).not.toBeNull();
    expect(festivoDe("2030-06-29")).toBeNull();
  });

  it("ningun año se queda sin festivos ni los duplica", () => {
    // Barrido largo: si el calculo se rompiera en algun año concreto, aqui se
    // veria antes de que llegue esa fecha.
    for (let ano = 2026; ano <= 2045; ano += 1) {
      const total = festivosDe(ano).size;
      expect(total).toBeGreaterThanOrEqual(17);
      expect(total).toBeLessThanOrEqual(18);
    }
  });

  it("los fijos no se mueven", () => {
    expect(festivoDe("2026-01-01")).toBe("Año Nuevo");
    expect(festivoDe("2026-05-01")).toBe("Día del Trabajo");
    expect(festivoDe("2026-07-20")).toBe("Día de la Independencia");
    expect(festivoDe("2026-08-07")).toBe("Batalla de Boyacá");
    expect(festivoDe("2026-12-08")).toBe("Inmaculada Concepción");
    expect(festivoDe("2026-12-25")).toBe("Navidad");
  });

  it("la Ley Emiliani corre el festivo al lunes siguiente", () => {
    // Reyes es el 6 de enero, que en 2026 cae martes: se celebra el 12.
    expect(festivoDe("2026-01-06")).toBeNull();
    expect(festivoDe("2026-01-12")).toBe("Reyes Magos");

    // El 11 de noviembre de 2026 es miercoles: pasa al 16.
    expect(festivoDe("2026-11-11")).toBeNull();
    expect(festivoDe("2026-11-16")).toBe("Independencia de Cartagena");
  });

  it("un festivo de Emiliani que ya cae en lunes se queda donde esta", () => {
    // 29 de junio de 2026 es lunes.
    expect(festivoDe("2026-06-29")).toBe("San Pedro y San Pablo");
    expect(festivoDe("2026-07-06")).toBeNull();
  });

  it("Jueves y Viernes Santo no se trasladan", () => {
    // Pascua de 2026: domingo 5 de abril.
    expect(festivoDe("2026-04-02")).toBe("Jueves Santo");
    expect(festivoDe("2026-04-03")).toBe("Viernes Santo");
  });

  it("los festivos de Pascua que si se trasladan caen en lunes", () => {
    expect(festivoDe("2026-05-18")).toBe("Ascensión del Señor");
    expect(festivoDe("2026-06-08")).toBe("Corpus Christi");
    expect(festivoDe("2026-06-15")).toBe("Sagrado Corazón");
  });

  it("sigue el movimiento de la Pascua de un año a otro", () => {
    // En 2027 la Pascua es el 28 de marzo, casi una semana antes que en 2026.
    expect(festivoDe("2027-03-25")).toBe("Jueves Santo");
    expect(festivoDe("2027-03-26")).toBe("Viernes Santo");
    expect(festivoDe("2027-04-02")).toBeNull();
  });

  it("todos los de Emiliani y los de Pascua trasladados caen en lunes", () => {
    const trasladados = [
      "Reyes Magos",
      "San José",
      "San Pedro y San Pablo",
      "Asunción de la Virgen",
      "Día de la Raza",
      "Todos los Santos",
      "Independencia de Cartagena",
      "Ascensión del Señor",
      "Corpus Christi",
      "Sagrado Corazón",
    ];

    for (const ano of [2026, 2027, 2028]) {
      for (const [fecha, nombre] of festivosDe(ano)) {
        if (!trasladados.includes(nombre)) continue;
        expect(new Date(`${fecha}T12:00:00.000Z`).getUTCDay()).toBe(1);
      }
    }
  });

  it("un dia normal no es festivo", () => {
    expect(festivoDe("2026-09-08")).toBeNull();
    expect(festivoDe("2026-02-17")).toBeNull();
  });

  it("no se rompe con una fecha invalida", () => {
    expect(festivoDe("")).toBeNull();
    expect(festivoDe("no-es-fecha")).toBeNull();
  });
});
