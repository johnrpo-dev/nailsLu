import type { PublicBookingInput, PublicBookingResult } from "@spa/shared";
import { apiGet, apiPost } from "@/shared/api/client";

export type AvailabilityResponse = {
  date: string;
  durationMinutes: number;
  slots: string[];
};

export function getAvailability(date: string, durationMinutes: number, signal?: AbortSignal) {
  const query = new URLSearchParams({ date, durationMinutes: String(durationMinutes) });
  return apiGet<AvailabilityResponse>(`/public/availability?${query}`, signal);
}

export function createPublicBooking(input: PublicBookingInput) {
  return apiPost<PublicBookingResult>("/public/bookings", input);
}
