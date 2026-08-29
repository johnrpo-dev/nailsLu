export function minutesFromTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function timeFromMinutes(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60).toString().padStart(2, "0");
  const minutes = (totalMinutes % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function addMinutes(time: string, minutes: number) {
  return timeFromMinutes(minutesFromTime(time) + minutes);
}

/**
 * Zona horaria del salon.
 *
 * Las horas se guardan como texto "HH:mm" en hora del salon, asi que para
 * saber si una franja ya paso hay que compararlas contra la hora de alli, no
 * contra la del servidor. Un servidor en UTC creeria que ya es de noche a las
 * siete de la tarde de Colombia, y dejaria de ofrecer toda la jornada.
 */
const ZONA_SALON = process.env.SALON_TIMEZONE ?? "America/Bogota";

/**
 * Fecha y hora actuales en el salon.
 *
 * Se usa `Intl` en vez de aritmetica sobre el desfase para no equivocarse con
 * el horario de verano de otras zonas: Colombia no lo aplica, pero el valor es
 * configurable y no quiero que la correccion dependa de eso.
 */
export function ahoraEnElSalon(): { fecha: string; minutos: number } {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_SALON,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const valor = (tipo: Intl.DateTimeFormatPartTypes) =>
    partes.find((p) => p.type === tipo)?.value ?? "00";

  // Algunas versiones de ICU devuelven "24" para la medianoche.
  const hora = valor("hour") === "24" ? "00" : valor("hour");

  return {
    fecha: `${valor("year")}-${valor("month")}-${valor("day")}`,
    minutos: Number(hora) * 60 + Number(valor("minute")),
  };
}

/** Fecha de hoy en el salon, en formato YYYY-MM-DD. */
export function todayIsoDate() {
  return ahoraEnElSalon().fecha;
}

export function rangesOverlap(firstStart: string, firstEnd: string, secondStart: string, secondEnd: string) {
  return minutesFromTime(firstStart) < minutesFromTime(secondEnd) && minutesFromTime(secondStart) < minutesFromTime(firstEnd);
}
