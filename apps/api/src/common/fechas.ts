import { BadRequestException } from "@nestjs/common";

/**
 * Fechas de agenda: el dia, sin hora ni zona.
 *
 * Vive en common porque lo necesitan las dos capas: los DTO para rechazar en
 * el borde y los servicios para construir la fecha que va a la base.
 */

export const FECHA_ISO = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Convierte "YYYY-MM-DD" en la medianoche UTC de ese dia, que es como se
 * guardan las fechas de agenda.
 *
 * Comprueba el viaje de ida y vuelta en vez de confiar en el texto de entrada,
 * porque `new Date()` falla de dos maneras distintas y ninguna avisa:
 *
 * - "2026-08-30T12:00:00Z" o "20260830" pasan `@IsDateString()`, pero
 *   concatenarles la hora da `Invalid Date`, y eso llega hasta Prisma como un
 *   500 en vez de un 400.
 * - "2026-02-31" tambien pasa `@IsDateString()` —valida el mes, no el dia del
 *   mes— y JS lo rueda en silencio al 3 de marzo. Una consulta que responde
 *   con otro rango sin quejarse es peor que una que falla.
 *
 * Si la fecha sobrevive al viaje, es la que pidieron.
 */
export function fechaUtc(iso: string) {
  const fecha = new Date(`${iso}T00:00:00.000Z`);
  if (Number.isNaN(fecha.getTime()) || fecha.toISOString().slice(0, 10) !== iso) {
    throw new BadRequestException(`Fecha inválida: ${iso}`);
  }
  return fecha;
}
