import type { CSSProperties } from "react";

import { apiBaseUrl } from "@/shared/api/base-url";

/** Las fotos las sirve el API, que corre en otro origen que la web. */
export function urlDeFoto(imageUrl?: string | null) {
  if (!imageUrl) return null;
  return imageUrl.startsWith("http") ? imageUrl : `${apiBaseUrl()}${imageUrl}`;
}

/**
 * Estilos de encuadre.
 *
 * `object-fit: cover` recorta la foto para llenar el marco entero, sea cual sea
 * su proporcion. Es lo que garantiza que la tarjeta nunca muestre huecos ni
 * pierda la esquina redondeada, sin depender de calcular ninguna escala.
 *
 * Sobre esa base: `objectPosition` decide que parte de la foto se ve y `scale`
 * acerca. La escala nunca baja de 100 porque encoger despegaria la imagen del
 * marco, que es justo el defecto que se buscaba evitar.
 */
export function estiloDeEncuadre(servicio: {
  imageFocalX?: number;
  imageFocalY?: number;
  imageScale?: number;
}): CSSProperties {
  const x = servicio.imageFocalX ?? 50;
  const y = servicio.imageFocalY ?? 50;
  const escala = Math.max(100, servicio.imageScale ?? 100) / 100;
  return {
    objectFit: "cover",
    objectPosition: `${x}% ${y}%`,
    transform: escala === 1 ? undefined : `scale(${escala})`,
  };
}

/**
 * Fotos de un servicio, la portada primero.
 *
 * Devuelve solo las que existen: si la duena subio tres, son tres. Nunca hay
 * huecos ni marcadores de posicion.
 */
export type FotoConEncuadre = { url: string; estilo: CSSProperties };

export function fotosDeServicio(servicio: {
  imageUrl?: string | null;
  imageFocalX?: number;
  imageFocalY?: number;
  imageScale?: number;
  images?: {
    id: string;
    url: string;
    imageFocalX?: number;
    imageFocalY?: number;
    imageScale?: number;
  }[];
}): FotoConEncuadre[] {
  const fotos: FotoConEncuadre[] = [];

  const portada = urlDeFoto(servicio.imageUrl);
  if (portada) fotos.push({ url: portada, estilo: estiloDeEncuadre(servicio) });

  for (const extra of servicio.images ?? []) {
    const url = urlDeFoto(extra.url);
    // Cada una con el suyo: sin esto se recortarian por el centro y el diseno
    // de las unas rara vez cae ahi.
    if (url) fotos.push({ url, estilo: estiloDeEncuadre(extra) });
  }

  return fotos;
}
