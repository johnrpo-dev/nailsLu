import { afterEach, describe, expect, it, vi } from "vitest";
import { generarClaveIdempotencia } from "../clave-idempotencia";

afterEach(() => vi.unstubAllGlobals());

describe("generarClaveIdempotencia", () => {
  it("genera claves distintas en cada llamada", () => {
    const claves = new Set(Array.from({ length: 200 }, generarClaveIdempotencia));
    expect(claves.size).toBe(200);
  });

  it("cumple el minimo de 10 caracteres que exige el contrato", () => {
    expect(generarClaveIdempotencia().length).toBeGreaterThanOrEqual(10);
  });

  it("funciona sin randomUUID, como en el celular por HTTP", () => {
    // randomUUID solo existe en contextos seguros: por la IP de la red local
    // no esta disponible y antes la reserva fallaba entera.
    vi.stubGlobal("crypto", { getRandomValues: globalThis.crypto.getRandomValues.bind(globalThis.crypto) });

    const clave = generarClaveIdempotencia();
    expect(clave).toMatch(/^[0-9a-f]{32}$/);
  });

  it("funciona sin ninguna api de criptografia", () => {
    vi.stubGlobal("crypto", undefined);
    expect(generarClaveIdempotencia().length).toBeGreaterThanOrEqual(10);
  });
});
