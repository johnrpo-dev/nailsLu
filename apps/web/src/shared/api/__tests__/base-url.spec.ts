import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * `base-url` lee la variable de entorno al importarse, asi que cada caso
 * necesita un modulo nuevo. `resetModules` obliga a reimportarlo.
 */
async function baseCon(configurada: string, hostDeLaPagina: string) {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_API_URL", configurada);
  vi.stubGlobal("window", { location: { hostname: hostDeLaPagina } });
  const { apiBaseUrl } = await import("../base-url");
  return apiBaseUrl();
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("apiBaseUrl", () => {
  it("conserva la ruta del API", async () => {
    /*
     * El fallo del primer despliegue: en produccion el API vive bajo /api y se
     * perdia, asi que las peticiones iban a la web y devolvian 404.
     */
    expect(await baseCon("https://nailslu.com/api", "nailslu.com")).toBe("https://nailslu.com/api");
  });

  it("quita la barra final para no duplicarla al concatenar", async () => {
    expect(await baseCon("https://nailslu.com/api/", "nailslu.com")).toBe("https://nailslu.com/api");
  });

  it("funciona sin ruta, como en desarrollo", async () => {
    expect(await baseCon("http://localhost:3001", "localhost")).toBe("http://localhost:3001");
  });

  it("cambia localhost por el host de la pagina al entrar desde el celular", async () => {
    // Abriendo el sitio por la IP de la red, `localhost` seria el propio movil.
    expect(await baseCon("http://localhost:3001", "192.168.1.50")).toBe("http://192.168.1.50:3001");
  });

  it("conserva la ruta tambien al sustituir el host", async () => {
    expect(await baseCon("http://localhost:3001/api", "192.168.1.50")).toBe(
      "http://192.168.1.50:3001/api",
    );
  });

  it("no toca un dominio real aunque la pagina venga de otro host", async () => {
    expect(await baseCon("https://api.nailslu.com", "nailslu.com")).toBe("https://api.nailslu.com");
  });

  it("devuelve el valor tal cual si no es una URL valida", async () => {
    expect(await baseCon("no-es-una-url", "nailslu.com")).toBe("no-es-una-url");
  });
});
