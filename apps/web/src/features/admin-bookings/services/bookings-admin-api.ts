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
