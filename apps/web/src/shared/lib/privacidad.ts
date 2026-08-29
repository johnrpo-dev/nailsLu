/**
 * Version vigente de la politica de tratamiento de datos.
 *
 * Debe coincidir con POLITICA_DATOS_VERSION del API, que la guarda junto a
 * cada reserva como evidencia de que version acepto cada clienta.
 */
export const POLITICA_VERSION = "2026-08-28";

/**
 * Datos de quien responde por los datos personales.
 *
 * La Ley 1581 de 2012 no exige NIT ni empresa constituida: una persona natural
 * que trata datos de sus clientas es igualmente responsable. Basta con
 * identificarse y dar un canal real para ejercer derechos.
 *
 * PENDIENTE: reemplazar por los datos reales antes de publicar.
 */
export const RESPONSABLE = {
  /** Nombre comercial del salon. */
  nombre: "NAILS LU SPA",
  /** Nombre completo de la persona responsable, tal como aparece en la cedula. */
  responsable: "[Nombre completo de la propietaria]",
  /** Cedula de ciudadania. Si en algun momento hay NIT, se cambia por el NIT. */
  identificacion: "[Numero de cedula]",
  /** Canal obligatorio para ejercer derechos. */
  correo: "[correo@ejemplo.com]",
  telefono: "[Numero de WhatsApp]",
  ciudad: "[Ciudad]",
  /**
   * Direccion fisica. Opcional a proposito: si se atiende en casa, publicarla
   * expone el domicilio y la ley no la exige mientras haya un canal de
   * contacto. Dejar en cadena vacia para no mostrarla.
   */
  direccion: "",
};
