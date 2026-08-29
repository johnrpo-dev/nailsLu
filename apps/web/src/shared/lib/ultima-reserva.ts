"use client";

/**
 * Ultima reserva hecha desde este navegador.
 *
 * El enlace a la cita solo aparecia en el dialogo de confirmacion. Si la
 * clienta lo cerraba y volvia diez minutos despues, no tenia por donde
 * consultarla: el codigo son 48 caracteres y nadie los apunta.
 *
 * Guardarlo aqui resuelve el caso normal, que es volver desde el mismo
 * telefono. No es un respaldo: si cambia de dispositivo o borra los datos del
 * navegador, se pierde. Por eso el enlace tambien va en el mensaje de WhatsApp,
 * que si queda en su conversacion.
 *
 * Solo se guarda el codigo y la fecha, nunca nombre ni telefono: en un
 * dispositivo compartido, quien lo abra no deberia saber de quien era la cita.
 */
const CLAVE = "spa-ultima-reserva";

export type UltimaReserva = {
  token: string;
  /** Fecha de la cita en ISO corto, para poder olvidarla cuando ya paso. */
  fecha: string;
};

export function guardarUltimaReserva(reserva: UltimaReserva) {
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(reserva));
  } catch {
    // Modo privado o almacenamiento lleno: se sigue sin guardar.
  }
}

export function leerUltimaReserva(): UltimaReserva | null {
  if (typeof window === "undefined") return null;
  try {
    const crudo = window.localStorage.getItem(CLAVE);
    if (!crudo) return null;
    const guardada = JSON.parse(crudo) as UltimaReserva;
    if (!guardada?.token || !guardada?.fecha) return null;

    /*
     * Una cita de hace un mes no le sirve de nada y ensucia la portada. Se
     * compara con la fecha de hoy en texto ISO, que ordena bien y evita
     * construir un Date con la zona horaria de por medio.
     */
    const hoy = new Date();
    const hoyIso = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
    if (guardada.fecha < hoyIso) {
      olvidarUltimaReserva();
      return null;
    }
    return guardada;
  } catch {
    return null;
  }
}

export function olvidarUltimaReserva() {
  try {
    window.localStorage.removeItem(CLAVE);
  } catch {
    // Nada que limpiar si el almacenamiento no esta disponible.
  }
}
