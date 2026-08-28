const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/** Las fotos las sirve el API, que corre en otro origen que la web. */
export function urlDeFoto(imageUrl?: string | null) {
  if (!imageUrl) return null;
  return imageUrl.startsWith("http") ? imageUrl : `${API_BASE_URL}${imageUrl}`;
}

/**
 * Estilos de encuadre.
 *
 * `objectPosition` mueve la foto dentro del marco y `scale` la acerca o aleja.
 * Se aplican sobre la imagen y no sobre el archivo: reencuadrar no vuelve a
 * subir nada ni pierde calidad.
 */
export function estiloDeEncuadre(servicio: {
  imageFocalX?: number;
  imageFocalY?: number;
  imageScale?: number;
}) {
  const x = servicio.imageFocalX ?? 50;
  const y = servicio.imageFocalY ?? 50;
  const escala = (servicio.imageScale ?? 100) / 100;
  return {
    objectPosition: `${x}% ${y}%`,
    transform: escala === 1 ? undefined : `scale(${escala})`,
  };
}
