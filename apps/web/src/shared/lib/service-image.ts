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
 * La imagen usa `object-fit: contain` y se agranda con `scale`, nunca se
 * encoge. Asi el elemento siempre llena el marco: si se encogiera se despegaria
 * de los bordes, dejaria huecos y la esquina redondeada dejaria de recortarlo,
 * que es justo lo que se veia mal.
 *
 * A escala 100 la foto se ve completa; al subirla el API calcula la escala que
 * la hace llenar el marco y esa queda como punto de partida.
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
    objectFit: "contain",
    objectPosition: `${x}% ${y}%`,
    transform: escala === 1 ? undefined : `scale(${escala})`,
  };
}
