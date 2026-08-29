import { describe, expect, it } from "vitest";
import { formatHora, formatRangoHoras } from "../format";

describe("formatHora", () => {
  it("quita el cero de la izquierda en la manana", () => {
    expect(formatHora("08:00")).toBe("8:00 a.m.");
    expect(formatHora("09:30")).toBe("9:30 a.m.");
  });

  it("pasa la tarde a 12 horas", () => {
    expect(formatHora("13:00")).toBe("1:00 p.m.");
    // La ultima cita de lunes a viernes.
    expect(formatHora("18:00")).toBe("6:00 p.m.");
    expect(formatHora("23:45")).toBe("11:45 p.m.");
  });

  it("trata mediodia y medianoche como las 12, no como las 0", () => {
    // El error clasico: `horas % 12` da 0 y saldria "0:00".
    expect(formatHora("12:00")).toBe("12:00 p.m.");
    expect(formatHora("12:30")).toBe("12:30 p.m.");
    expect(formatHora("00:00")).toBe("12:00 a.m.");
    expect(formatHora("00:15")).toBe("12:15 a.m.");
  });

  it("no toca la hora si no la entiende", () => {
    // Antes de romper la pantalla, mejor mostrar el valor crudo.
    expect(formatHora("")).toBe("");
    expect(formatHora("25:00")).toBe("25:00");
    expect(formatHora("mediodia")).toBe("mediodia");
  });
});

describe("formatRangoHoras", () => {
  it("formatea los dos extremos", () => {
    expect(formatRangoHoras("08:00", "09:30")).toBe("8:00 a.m. a 9:30 a.m.");
  });

  it("cruza el mediodia", () => {
    expect(formatRangoHoras("11:30", "14:00")).toBe("11:30 a.m. a 2:00 p.m.");
  });
});
