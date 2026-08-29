/**
 * Direccion del API.
 *
 * En desarrollo `NEXT_PUBLIC_API_URL` apunta a `localhost`, que solo es valido
 * si la pagina se abre en el mismo equipo. Al entrar desde el celular por la IP
 * de la red, ese `localhost` es el propio telefono y las peticiones fallan.
 *
 * Cuando la direccion configurada es local pero la pagina llega desde otro
 * host, se reutiliza el host de la pagina conservando el puerto del API. Asi el
 * sitio funciona desde el PC y desde el celular sin recompilar ni fijar una IP
 * que cambia sola con el router.
 *
 * En produccion `NEXT_PUBLIC_API_URL` es un dominio real y esto no interviene.
 */
const CONFIGURADA = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const ES_LOCAL = ["localhost", "127.0.0.1", "[::1]"];

export function apiBaseUrl() {
  if (typeof window === "undefined") return CONFIGURADA;

  try {
    const url = new URL(CONFIGURADA);
    if (ES_LOCAL.includes(url.hostname) && !ES_LOCAL.includes(window.location.hostname)) {
      url.hostname = window.location.hostname;
      return url.origin;
    }
    return url.origin;
  } catch {
    return CONFIGURADA;
  }
}
