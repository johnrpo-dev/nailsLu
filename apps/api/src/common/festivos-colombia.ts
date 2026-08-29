/**
 * Festivos de Colombia.
 *
 * Se calculan, no se listan: una tabla escrita a mano caduca cada diciembre y
 * el dia que nadie la actualice el salon empezaria a aceptar citas en festivo
 * sin que nada avisara.
 *
 * Hay tres grupos:
 *
 *  - Fijos, que caen siempre en la misma fecha.
 *  - Los de la Ley 51 de 1983, la "Ley Emiliani", que se trasladan al lunes
 *    siguiente cuando no caen en lunes.
 *  - Los que dependen de la Pascua, que a su vez se mueve cada ano.
 */

/** Fecha en ISO corto, siempre en UTC para no depender de la zona del servidor. */
function iso(fecha: Date) {
  return fecha.toISOString().slice(0, 10);
}

function sumarDias(fecha: Date, dias: number) {
  const copia = new Date(fecha.getTime());
  copia.setUTCDate(copia.getUTCDate() + dias);
  return copia;
}

/**
 * Traslado de la Ley Emiliani: al lunes siguiente, salvo que ya sea lunes.
 */
function alLunesSiguiente(fecha: Date) {
  const dia = fecha.getUTCDay();
  return dia === 1 ? fecha : sumarDias(fecha, (8 - dia) % 7);
}

/**
 * Domingo de Pascua por el metodo de Meeus/Jones/Butcher para el calendario
 * gregoriano. Es aritmetica pura: no hace falta ninguna tabla ni libreria.
 */
function domingoDePascua(ano: number) {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(ano, mes - 1, dia));
}

const FIJOS: [mes: number, dia: number, nombre: string][] = [
  [1, 1, "Año Nuevo"],
  [5, 1, "Día del Trabajo"],
  [7, 20, "Día de la Independencia"],
  [8, 7, "Batalla de Boyacá"],
  [12, 8, "Inmaculada Concepción"],
  [12, 25, "Navidad"],
];

/** Festivos que se corren al lunes siguiente. */
const EMILIANI: [mes: number, dia: number, nombre: string][] = [
  [1, 6, "Reyes Magos"],
  [3, 19, "San José"],
  [6, 29, "San Pedro y San Pablo"],
  [8, 15, "Asunción de la Virgen"],
  [10, 12, "Día de la Raza"],
  [11, 1, "Todos los Santos"],
  [11, 11, "Independencia de Cartagena"],
];

/**
 * Festivos que dependen de la Pascua, con su desplazamiento en dias.
 *
 * Jueves y Viernes Santo no se trasladan; los otros tres ya llevan incorporado
 * el salto al lunes, por eso son 43, 64 y 71 y no 39, 60 y 68.
 */
const DE_PASCUA: [dias: number, nombre: string][] = [
  [-3, "Jueves Santo"],
  [-2, "Viernes Santo"],
  [43, "Ascensión del Señor"],
  [64, "Corpus Christi"],
  [71, "Sagrado Corazón"],
];

/** Festivos de un ano, indexados por fecha ISO. */
export function festivosDe(ano: number): Map<string, string> {
  const festivos = new Map<string, string>();

  for (const [mes, dia, nombre] of FIJOS) {
    festivos.set(iso(new Date(Date.UTC(ano, mes - 1, dia))), nombre);
  }
  for (const [mes, dia, nombre] of EMILIANI) {
    festivos.set(iso(alLunesSiguiente(new Date(Date.UTC(ano, mes - 1, dia)))), nombre);
  }

  const pascua = domingoDePascua(ano);
  for (const [dias, nombre] of DE_PASCUA) {
    festivos.set(iso(sumarDias(pascua, dias)), nombre);
  }

  return festivos;
}

/**
 * Nombre del festivo de una fecha, o null si es un dia normal.
 *
 * Se cachea por ano porque el calculo se repite en cada consulta de agenda y
 * el resultado no cambia nunca.
 */
const cache = new Map<number, Map<string, string>>();

export function festivoDe(fechaIso: string): string | null {
  const ano = Number(fechaIso.slice(0, 4));
  if (!Number.isInteger(ano)) return null;

  let delAno = cache.get(ano);
  if (!delAno) {
    delAno = festivosDe(ano);
    cache.set(ano, delAno);
  }
  return delAno.get(fechaIso) ?? null;
}
