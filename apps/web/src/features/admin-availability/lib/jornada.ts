import type { BusinessHour } from "../services/availability-admin-api";

/**
 * Jornada de reserva cuando no hay ningun horario configurado.
 *
 * Solo se usa como ultimo recurso: lo normal es copiar el horario real del dia.
 */
export const JORNADA_POR_DEFECTO = { inicio: "08:00", fin: "18:00" };

/** Rango que abarcaba antes "Todo el dia", para seguir reconociendo los viejos. */
export const DIA_COMPLETO_ANTIGUO = { inicio: "00:00", fin: "23:59" };

/**
 * Horas de trabajo de una fecha concreta.
 *
 * "Todo el dia" significaba de medianoche a medianoche, y eso abria la
 * madrugada entera: un domingo marcado como disponible ofrecia citas a las
 * 3 de la manana. Ahora copia la jornada real del dia.
 *
 * Si ese dia esta cerrado no hay horario que copiar, asi que se toma el rango
 * mas amplio de la semana: quien abre un domingo suelto espera trabajar sus
 * horas de siempre, no las de nadie mas.
 */
export function jornadaDe(fechaIso: string, hours: BusinessHour[]) {
  const activos = hours.filter((h) => h.isActive);
  if (!activos.length) return JORNADA_POR_DEFECTO;

  const weekday = new Date(`${fechaIso}T00:00:00.000Z`).getUTCDay();
  const delDia = activos.filter((h) => h.weekday === weekday);
  const base = delDia.length ? delDia : activos;

  return {
    inicio: base.reduce((min, h) => (h.startTime < min ? h.startTime : min), base[0].startTime),
    fin: base.reduce((max, h) => (h.endTime > max ? h.endTime : max), base[0].endTime),
  };
}
