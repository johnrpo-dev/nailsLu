/**
 * Version vigente de la politica de tratamiento de datos.
 *
 * Se guarda junto a cada reserva para saber que texto acepto cada clienta. Al
 * publicar una politica nueva hay que subir esta fecha: las autorizaciones
 * anteriores siguen siendo validas para su version, no para la nueva.
 *
 * Debe coincidir con la fecha que muestra la pagina de politica en la web.
 */
export const POLITICA_DATOS_VERSION = "2026-08-29";

/** Dias que se conservan los intentos de reserva antes de borrarse. */
export const RETENCION_INTENTOS_DIAS = 30;
