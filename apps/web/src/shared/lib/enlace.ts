"use client";

/**
 * Ruta relativa a direccion completa.
 *
 * Pegar "/reserva/abc" en un chat no lleva a ninguna parte. Se usa el origen
 * real de la pagina y no `NEXT_PUBLIC_SITE_URL` para que el enlace tambien
 * sirva al probar desde el celular por la IP de la red, donde el dominio de
 * produccion todavia no existe.
 */
export function enlaceAbsoluto(ruta: string) {
  if (typeof window === "undefined") return ruta;
  return `${window.location.origin}${ruta}`;
}
