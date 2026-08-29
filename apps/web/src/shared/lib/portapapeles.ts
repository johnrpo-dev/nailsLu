"use client";

/**
 * Copiar texto, tambien fuera de contexto seguro.
 *
 * `navigator.clipboard` solo existe en HTTPS o en localhost. Abriendo el sitio
 * desde el celular por la IP de la red (http://192.168.x.x) no esta definido, y
 * la promesa ni siquiera llega a rechazarse: falla al leer la propiedad. Sin
 * respaldo, el boton de copiar no hacia nada y no lo decia.
 *
 * El respaldo es `execCommand("copy")`, que esta obsoleto pero funciona en todo
 * navegador actual y no exige contexto seguro. En produccion, con dominio y
 * HTTPS, se usa siempre la primera via.
 *
 * Devuelve si se copio, para que quien llame avise en pantalla en vez de
 * fingir que salio bien.
 */
export async function copiarAlPortapapeles(texto: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(texto);
      return true;
    } catch {
      // Permiso denegado o documento sin foco: se intenta el respaldo.
    }
  }

  if (typeof document === "undefined") return false;

  const campo = document.createElement("textarea");
  campo.value = texto;
  /*
   * Fuera de la vista pero seleccionable: `display:none` o `hidden` harian que
   * el navegador no lo considere y la copia fallaria. En iOS ademas hay que
   * evitar que reciba el zoom automatico, de ahi el tamano de fuente.
   */
  campo.setAttribute("readonly", "");
  campo.style.position = "fixed";
  campo.style.top = "0";
  campo.style.left = "-9999px";
  campo.style.fontSize = "16px";
  document.body.appendChild(campo);

  const seleccionPrevia = document.activeElement as HTMLElement | null;

  try {
    /*
     * Hay que enfocar antes de seleccionar. Con `select()` a secas el foco se
     * queda en el boton, la seleccion sale vacia y `execCommand` copia una
     * cadena vacia sin fallar: el peor resultado posible, porque avisariamos de
     * un exito falso.
     *
     * Safari en iOS ignora `select()` en un campo de solo lectura, asi que ahi
     * se selecciona con un Range sobre el nodo. El telefono de la duena es un
     * iPhone y sus clientas tambien reservan desde el movil.
     */
    campo.focus();
    campo.select();

    const rango = document.createRange();
    rango.selectNodeContents(campo);
    const seleccion = window.getSelection();
    seleccion?.removeAllRanges();
    seleccion?.addRange(rango);
    campo.setSelectionRange(0, texto.length);

    // Si la seleccion sigue vacia, copiar no serviria de nada.
    if (!campo.selectionEnd) return false;
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.body.removeChild(campo);
    // Devolver el foco a donde estaba, para no perder al que navega con teclado.
    seleccionPrevia?.focus?.();
  }
}
