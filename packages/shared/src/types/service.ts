/**
 * Servicio del catalogo.
 *
 * No lleva precio a proposito: la tarifa se acuerda con cada clienta, asi que
 * no es una propiedad del servicio.
 */
export type ServiceSummary = {
  id: string;
  name: string;
  description?: string | null;
  durationMinutes: number;
  isActive: boolean;
  /** Ruta relativa al API, por ejemplo `/uploads/abc.webp`. */
  imageUrl?: string | null;
  /** Punto focal del recorte, 0-100 en cada eje. Centro por defecto. */
  imageFocalX?: number;
  imageFocalY?: number;
  /** 100 llena la tarjeta; menos deja aire, mas acerca. */
  imageScale?: number;
  /** Fotos adicionales del carrusel, con su propio encuadre. */
  images?: {
    id: string;
    url: string;
    imageFocalX?: number;
    imageFocalY?: number;
    imageScale?: number;
  }[];
};
