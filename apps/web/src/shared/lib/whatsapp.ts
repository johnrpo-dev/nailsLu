/**
 * Aviso de reserva por WhatsApp, sin API ni tramites.
 *
 * Se arma un enlace `wa.me` con el mensaje ya redactado hacia el numero del
 * spa. La clienta solo pulsa enviar y el aviso llega al WhatsApp de siempre.
 *
 * Es una comodidad, no la fuente de verdad: la reserva ya quedo guardada en la
 * base aunque la clienta nunca pulse el boton. El panel siempre la muestra.
 */

import { enlaceAbsoluto } from "./enlace";
import { formatHora } from "./format";

/** Numero del spa con indicativo de pais y sin signos: 573001234567. */
const NUMERO_SPA = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "") ?? "";

export function hayWhatsappConfigurado() {
  return NUMERO_SPA.length >= 10;
}

export function construirAvisoReserva(datos: {
  clientName: string;
  phone: string;
  fechaLarga: string;
  startTime: string;
  endTime: string;
  servicios: string[];
  publicToken: string;
}) {
  const lineas = [
    "Hola, acabo de reservar una cita.",
    "",
    `Nombre: ${datos.clientName}`,
    `Telefono: ${datos.phone}`,
    `Fecha: ${datos.fechaLarga}`,
    `Hora: ${formatHora(datos.startTime)} a ${formatHora(datos.endTime)}`,
    `Servicios: ${datos.servicios.join(", ")}`,
    "",
    // El enlace completo, no un trozo del codigo: asi la clienta conserva en su
    // propia conversacion la forma de consultar o cancelar la cita, aunque
    // cambie de telefono o borre los datos del navegador.
    `Mi cita: ${enlaceAbsoluto(`/reserva/${datos.publicToken}`)}`,
  ];

  // encodeURIComponent respeta los saltos de linea; WhatsApp los interpreta.
  return `https://wa.me/${NUMERO_SPA}?text=${encodeURIComponent(lineas.join("\n"))}`;
}
