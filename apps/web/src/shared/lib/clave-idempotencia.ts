/**
 * Clave unica por intento de reserva.
 *
 * El API la usa para no duplicar la cita si la clienta pulsa dos veces o la
 * conexion se corta y el navegador reintenta.
 *
 * No se usa `crypto.randomUUID()` directamente porque solo existe en contextos
 * seguros: HTTPS o localhost. Al entrar desde el celular por la IP de la red el
 * contexto no es seguro, la funcion no existe y la reserva fallaba entera.
 *
 * `crypto.getRandomValues` si esta disponible siempre, asi que el respaldo
 * mantiene la misma calidad de aleatoriedad.
 */
export function generarClaveIdempotencia() {
  const c = typeof crypto !== "undefined" ? crypto : undefined;

  if (typeof c?.randomUUID === "function") return c.randomUUID();

  if (typeof c?.getRandomValues === "function") {
    const bytes = c.getRandomValues(new Uint8Array(16));
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  }

  // Ultimo recurso para navegadores muy viejos: peor aleatoriedad, pero la
  // clave solo debe ser unica entre los intentos de una misma clienta.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
}
