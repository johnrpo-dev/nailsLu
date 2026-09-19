/**
 * Calculos del calendario mensual del panel.
 *
 * Todo se hace con fechas en texto "YYYY-MM-DD" y aritmetica en UTC. Construir
 * fechas con la hora local del navegador es la forma clasica de que un dia se
 * cuele en la casilla de al lado cuando cambia el horario o la zona.
 */

const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

/** Iniciales de la semana, empezando en domingo como Google Calendar. */
export const INICIALES_SEMANA = ["d", "l", "m", "m", "j", "v", "s"];

function iso(fecha: Date) {
  return fecha.toISOString().slice(0, 10);
}

/**
 * Las 42 casillas de un mes: seis semanas completas desde el domingo anterior
 * al dia 1.
 *
 * Siempre seis filas, aunque el mes quepa en cinco, para que la cuadricula no
 * cambie de alto al pasar de mes: si saltara, el dedo acabaria tocando otra
 * casilla.
 *
 * `mes` va de 0 a 11, como en `Date`.
 */
export function diasDelMes(ano: number, mes: number): string[] {
  const primero = new Date(Date.UTC(ano, mes, 1));
  const inicio = new Date(primero);
  inicio.setUTCDate(1 - primero.getUTCDay());

  return Array.from({ length: 42 }, (_, i) => {
    const dia = new Date(inicio);
    dia.setUTCDate(inicio.getUTCDate() + i);
    return iso(dia);
  });
}

/** "septiembre 2026". */
export function tituloMes(ano: number, mes: number) {
  return `${MESES[mes]} ${ano}`;
}

/** Mes anterior o siguiente, cruzando de ano cuando toca. */
export function moverMes(ano: number, mes: number, delta: number) {
  const fecha = new Date(Date.UTC(ano, mes + delta, 1));
  return { ano: fecha.getUTCFullYear(), mes: fecha.getUTCMonth() };
}

/** Si una fecha "YYYY-MM-DD" cae dentro del mes indicado. */
export function esDelMes(fechaIso: string, ano: number, mes: number) {
  return Number(fechaIso.slice(0, 4)) === ano && Number(fechaIso.slice(5, 7)) - 1 === mes;
}
