import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { guardarUltimaReserva, leerUltimaReserva, olvidarUltimaReserva } from "../ultima-reserva";

const CLAVE = "spa-ultima-reserva";

/** localStorage falso: jsdom no siempre lo expone y aqui interesa controlarlo. */
function almacenFalso() {
  let datos: Record<string, string> = {};
  return {
    getItem: (k: string) => datos[k] ?? null,
    setItem: (k: string, v: string) => {
      datos[k] = v;
    },
    removeItem: (k: string) => {
      delete datos[k];
    },
    clear: () => {
      datos = {};
    },
  };
}

beforeEach(() => {
  vi.stubGlobal("window", { localStorage: almacenFalso() });
  // 29 de agosto de 2026, en hora local.
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 7, 29, 10, 0, 0));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("ultima reserva", () => {
  it("devuelve null cuando no hay nada guardado", () => {
    expect(leerUltimaReserva()).toBeNull();
  });

  it("recuerda una cita futura", () => {
    guardarUltimaReserva({ token: "abc", fecha: "2026-09-05" });
    expect(leerUltimaReserva()).toEqual({ token: "abc", fecha: "2026-09-05" });
  });

  it("conserva la cita de hoy", () => {
    // El caso limite: hoy todavia sirve, solo se olvida a partir de manana.
    guardarUltimaReserva({ token: "abc", fecha: "2026-08-29" });
    expect(leerUltimaReserva()?.token).toBe("abc");
  });

  it("olvida una cita que ya paso, y la borra del almacenamiento", () => {
    guardarUltimaReserva({ token: "abc", fecha: "2026-08-28" });
    expect(leerUltimaReserva()).toBeNull();
    // No basta con no devolverla: tiene que dejar de ocupar sitio.
    expect(window.localStorage.getItem(CLAVE)).toBeNull();
  });

  it("no se rompe con contenido corrupto", () => {
    window.localStorage.setItem(CLAVE, "{esto no es json");
    expect(leerUltimaReserva()).toBeNull();
  });

  it("ignora un registro incompleto", () => {
    window.localStorage.setItem(CLAVE, JSON.stringify({ token: "abc" }));
    expect(leerUltimaReserva()).toBeNull();
  });

  it("olvida a peticion", () => {
    guardarUltimaReserva({ token: "abc", fecha: "2026-09-05" });
    olvidarUltimaReserva();
    expect(leerUltimaReserva()).toBeNull();
  });
});
