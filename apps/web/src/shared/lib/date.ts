/**
 * Fechas de agenda en hora local.
 *
 * `toISOString()` convierte a UTC, asi que en Colombia (UTC-5) a partir de las
 * 19:00 locales devolvia el dia siguiente. La agenda se arma con la fecha que
 * ve la clienta en su reloj, no con la del meridiano cero.
 */

export function toLocalIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayIsoDate() {
  return toLocalIsoDate(new Date());
}

export type RollingDay = {
  iso: string;
  weekday: string;
  day: string;
  month: string;
  isToday: boolean;
};

export function createRollingDays(count: number, from = new Date()): RollingDay[] {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const todayIso = toLocalIsoDate(start);

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const iso = toLocalIsoDate(date);
    return {
      iso,
      weekday: date.toLocaleDateString("es-CO", { weekday: "short" }),
      day: date.toLocaleDateString("es-CO", { day: "2-digit" }),
      month: date.toLocaleDateString("es-CO", { month: "short" }),
      isToday: iso === todayIso,
    };
  });
}

export function formatLongDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
