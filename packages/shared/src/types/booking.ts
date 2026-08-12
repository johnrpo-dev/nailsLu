export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW";

export type BookingSummary = {
  id: string;
  clientName: string;
  phone: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  totalDurationMinutes: number;
};

/** Snapshot del servicio tal como quedo guardado en la reserva. */
export type BookedServiceSnapshot = {
  serviceId: string;
  serviceNameSnapshot: string;
  durationSnapshotMinutes: number;
};

/** Respuesta de POST /public/bookings. */
export type PublicBookingResult = {
  id: string;
  publicToken: string;
  status: BookingStatus;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  totalDurationMinutes: number;
  notes?: string | null;
  client: { id: string; fullName: string; phone: string };
  services: BookedServiceSnapshot[];
};
