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

/** Fecha de hoy en hora local del servidor, en formato YYYY-MM-DD. */
export function todayIsoDate() {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function rangesOverlap(firstStart: string, firstEnd: string, secondStart: string, secondEnd: string) {
  return minutesFromTime(firstStart) < minutesFromTime(secondEnd) && minutesFromTime(secondStart) < minutesFromTime(firstEnd);
}
