import type { Metadata } from "next";
import { BookingStatusCard } from "@/features/public-booking/components/booking-status-card";

export const metadata: Metadata = {
  title: "Tu cita · NAILS LU SPA",
  description: "Consulta el estado de tu cita o cancélala.",
  /*
   * La URL lleva el codigo de la reserva. Que no la indexe nadie ni la mande
   * como referer a otro sitio.
   */
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

/** Desde Next 15 `params` es una promesa. */
export default async function ReservaPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <BookingStatusCard token={token} />;
}
