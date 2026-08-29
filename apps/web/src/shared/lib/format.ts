/**
 * Hora de "HH:mm" a formato de 12 horas: "08:00" pasa a "8:00 a.m.".
 *
 * Se hace a mano en vez de con `Intl`, que segun la version de ICU del
 * navegador devuelve "a. m.", "AM" o espacios finos que no se ven pero
 * desalinean la parrilla. Aqui el resultado es el mismo en todas partes.
 *
 * Solo para mostrar. Los `input type="time"` y todo lo que viaja al API siguen
 * en 24 horas, que es lo que entiende el servidor y lo que ordena bien.
 */
export function formatHora(hhmm: string) {
  const [h, m] = hhmm.split(":");
  const horas = Number(h);
  if (!Number.isInteger(horas) || horas < 0 || horas > 23 || !m) return hhmm;

  const sufijo = horas < 12 ? "a.m." : "p.m.";
  // Medianoche y mediodia son las 12, no las 0.
  const doce = horas % 12 === 0 ? 12 : horas % 12;
  return `${doce}:${m} ${sufijo}`;
}

/** Rango horario ya formateado: "8:00 a.m. a 9:30 a.m.". */
export function formatRangoHoras(inicio: string, fin: string) {
  return `${formatHora(inicio)} a ${formatHora(fin)}`;
}

export function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}
