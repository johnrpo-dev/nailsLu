/**
 * Version vigente de la politica de tratamiento de datos.
 *
 * Debe coincidir con POLITICA_DATOS_VERSION del API, que la guarda junto a
 * cada reserva como evidencia de que version acepto cada clienta.
 */
export const POLITICA_VERSION = "2026-08-29";

/**
 * Datos de quien responde por los datos personales.
 *
 * La Ley 1581 de 2012 no exige NIT ni empresa constituida: una persona natural
 * que trata datos de sus clientas es igualmente responsable. Basta con
 * identificarse y dar un canal real para ejercer derechos.
 */
export const RESPONSABLE = {
  /** Nombre comercial del salon. */
  nombre: "NAILS LU SPA",
  /** Nombre completo de la persona responsable. */
  responsable: "Yerika Johana Arango",
  /**
   * Numero de cedula. Vacio a proposito.
   *
   * La ley pide identificar al responsable y dar un canal de contacto, no
   * publicar el numero del documento. En Colombia la cedula se usa para
   * verificar identidad, asi que ponerla en una pagina publica la expone a
   * suplantacion sin aportar nada a la clienta: el nombre completo, la ciudad,
   * el correo y el WhatsApp ya identifican a quien responde. Si algun dia hay
   * NIT, ese si conviene publicarlo, porque es un dato de empresa.
   */
  identificacion: "",
  /** Canal obligatorio para ejercer derechos. */
  correo: "Y_erika1234@hotmail.com",
  telefono: "304 544 2496",
  ciudad: "Medellín",
  /**
   * Direccion fisica. Opcional a proposito: si se atiende en casa, publicarla
   * expone el domicilio y la ley no la exige mientras haya un canal de
   * contacto. Dejar en cadena vacia para no mostrarla.
   */
  direccion: "",
};
