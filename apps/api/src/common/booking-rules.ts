/**
 * Reglas de agenda que dependen del negocio, no de la tecnica.
 *
 * Viven aparte para que se puedan ajustar sin buscarlas por el codigo.
 */

/**
 * Minutos bloqueados despues de una cita a domicilio, para el traslado.
 *
 * Una cita en el spa termina y la siguiente puede empezar enseguida. A
 * domicilio hay que recoger, salir y volver, asi que el hueco es parte real de
 * la cita aunque no sea trabajo.
 *
 * Se aplica a los dos lados: el mismo margen para ir y para volver. Solo
 * cuenta para separar citas entre si, nunca para recortar la jornada: a la
 * primera cita del dia se puede salir de casa directamente.
 */
export const MINUTOS_TRASLADO_DOMICILIO = 50;
