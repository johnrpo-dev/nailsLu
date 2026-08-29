/**
 * Reglas de agenda que la web necesita conocer para explicarlas.
 *
 * El calculo real lo hace el API, que es la fuente de verdad; esto solo sirve
 * para decirle a la clienta por que ve menos horarios. Si cambia alla, hay que
 * cambiarlo aqui: son dos sitios porque el API no expone la regla, y duplicar
 * un numero es preferible a inventar un endpoint para consultarlo.
 */
export const MINUTOS_TRASLADO_DOMICILIO = 50;

/**
 * Suma minutos a una hora "HH:mm".
 *
 * Solo para mostrar en pantalla hasta cuando queda ocupada la agenda. El
 * calculo que decide si una franja cabe lo hace el API.
 */
export function sumarMinutos(hora: string, minutos: number) {
  const [h, m] = hora.split(":").map(Number);
  if (!Number.isInteger(h) || !Number.isInteger(m)) return hora;
  const total = h * 60 + m + minutos;
  const hh = String(Math.floor(total / 60) % 24).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}
