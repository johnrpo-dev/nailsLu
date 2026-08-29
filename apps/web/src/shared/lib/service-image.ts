import type { CSSProperties } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/** Las fotos las sirve el API, que corre en otro origen que la web. */
export function urlDeFoto(imageUrl?: string | null) {
  if (!imageUrl) return null;
  return imageUrl.startsWith("http") ? imageUrl : `${API_BASE_URL}${imageUrl}`;
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
