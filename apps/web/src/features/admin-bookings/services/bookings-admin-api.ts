import type { BookingStatus } from "@spa/shared";
import { apiGet, apiPatch } from "@/shared/api/client";

export type AdminBooking = {
  id: string;
  publicToken: string;
  status: BookingStatus;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  totalDurationMinutes: number;
  notes?: string | null;
  serviceLocation: "SPA" | "DOMICILIO";
  address?: string | null;
  travelBufferMinutes: number;
  createdAt: string;
  client: { id: string; fullName: string; phone: string };
  services: { id: string; serviceNameSnapshot: string; durationSnapshotMinutes: number }[];
};

export type BookingScope = "active" | "today" | "all";

export function listAdminBookings(scope: BookingScope, signal?: AbortSignal) {
  return apiGet<AdminBooking[]>(`/admin/bookings?scope=${scope}`, signal);
}

export function updateBookingStatus(id: string, status: BookingStatus) {
  return apiPatch<AdminBooking>(`/admin/bookings/${id}/status`, { status });
}

/**
 * Ajusta el traslado de una cita a domicilio.
 *
 * Devuelve la reserva actualizada, para que la tarjeta refleje el hueco nuevo
 * sin recargar toda la lista.
 */
export function updateTravelBuffer(id: string, minutes: number) {
  return apiPatch<AdminBooking>(`/admin/bookings/${id}/travel-buffer`, { minutes });
}
