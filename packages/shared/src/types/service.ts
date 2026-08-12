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
};
