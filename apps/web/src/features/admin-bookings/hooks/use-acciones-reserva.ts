"use client";

import { useCallback, useState, type Dispatch, type SetStateAction } from "react";
import type { BookingStatus } from "@spa/shared";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/shared/api/client";
import { updateBookingStatus, updateTravelBuffer, type AdminBooking } from "../services/bookings-admin-api";
import { ETIQUETA_ESTADO } from "../components/tarjeta-reserva";

/**
 * Confirmar, cancelar y ajustar el traslado de una reserva.
 *
 * Lo comparten la lista y el calendario: son las mismas acciones sobre la
 * misma tarjeta, y tenerlas dos veces era garantia de que acabaran
 * comportandose distinto.
 *
 * `quitarAlCerrar`: en la lista de activas, una cita cancelada o atendida ya
 * no pertenece a ella y desaparece. En el calendario se queda, tachada.
 */
export function useAccionesReserva(
  setBookings: Dispatch<SetStateAction<AdminBooking[]>>,
  quitarAlCerrar: boolean,
) {
  const [actualizando, setActualizando] = useState<string | null>(null);
  const { showToast } = useToast();

  const cambiarEstado = useCallback(
    async (booking: AdminBooking, nuevo: BookingStatus) => {
      setActualizando(booking.id);
      try {
        const actualizada = await updateBookingStatus(booking.id, nuevo);
        setBookings((actuales) =>
          quitarAlCerrar && (nuevo === "CANCELLED" || nuevo === "COMPLETED" || nuevo === "NO_SHOW")
            ? actuales.filter((item) => item.id !== booking.id)
            : actuales.map((item) => (item.id === booking.id ? { ...item, ...actualizada } : item)),
        );
        showToast({ title: `${booking.client.fullName}: ${ETIQUETA_ESTADO[nuevo].toLowerCase()}` });
      } catch (error) {
        showToast({
          title: "No pudimos actualizar la reserva",
          description: error instanceof ApiError ? error.message : "Intenta de nuevo.",
          variant: "error",
        });
      } finally {
        setActualizando(null);
      }
    },
    [quitarAlCerrar, setBookings, showToast],
  );

  const cambiarTraslado = useCallback(
    async (booking: AdminBooking, minutos: number) => {
      setActualizando(booking.id);
      try {
        const actualizada = await updateTravelBuffer(booking.id, minutos);
        setBookings((actuales) =>
          actuales.map((item) => (item.id === booking.id ? { ...item, ...actualizada } : item)),
        );
        showToast({
          title: minutos === 0 ? "Traslado quitado" : `Traslado: ${minutos} min`,
          description: "La agenda se recalculó con el hueco nuevo.",
        });
      } catch (error) {
        showToast({
          title: "No pudimos cambiar el traslado",
          description: error instanceof ApiError ? error.message : "Intenta de nuevo.",
          variant: "error",
        });
      } finally {
        setActualizando(null);
      }
    },
    [setBookings, showToast],
  );

  return { actualizando, cambiarEstado, cambiarTraslado };
}
