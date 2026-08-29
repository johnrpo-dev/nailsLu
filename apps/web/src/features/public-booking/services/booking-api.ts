import type { BookingStatus, PublicBookingInput, PublicBookingResult } from "@spa/shared";
import { apiGet, apiPost } from "@/shared/api/client";

export type AvailabilityResponse = {
  date: string;
  durationMinutes: number;
  slots: string[];
};

export function getAvailability(
  date: string,
  durationMinutes: number,
  serviceLocation: string,
  signal?: AbortSignal,
) {
  const query = new URLSearchParams({ date, durationMinutes: String(durationMinutes) });
  // A domicilio el API descuenta ademas el traslado, asi que devuelve menos
  // franjas. Sin modalidad calcularia como si fuera en el spa.
  if (serviceLocation) query.set("serviceLocation", serviceLocation);
  return apiGet<AvailabilityResponse>(`/public/availability?${query}`, signal);
}

export function createPublicBooking(input: PublicBookingInput) {
  return apiPost<PublicBookingResult>("/public/bookings", input);
}

/**
 * Estado de una reserva consultado con su codigo.
 *
 * El API devuelve a proposito menos campos que al reservar: ni nombre, ni
 * telefono, ni servicios. El codigo viaja en la URL y puede acabar en el
 * historial del navegador o en un chat compartido, asi que quien lo tenga solo
 * ve cuando es la cita, no de quien es.
 */
export type PublicBookingStatus = {
  status: BookingStatus;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  totalDurationMinutes: number;
  serviceLocation: "SPA" | "DOMICILIO";
};

export function getPublicBookingStatus(token: string, signal?: AbortSignal) {
  return apiGet<PublicBookingStatus>(`/public/bookings/${encodeURIComponent(token)}/status`, signal);
}

export function cancelPublicBooking(token: string) {
  return apiPost<PublicBookingStatus>(`/public/bookings/${encodeURIComponent(token)}/cancel`, {});
}
