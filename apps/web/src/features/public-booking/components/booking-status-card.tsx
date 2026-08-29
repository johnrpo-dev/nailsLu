"use client";

import { AlertCircle, ArrowLeft, CalendarCheck, Clock3, RotateCw, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { BookingStatus } from "@spa/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/shared/api/client";
import { formatLongDate } from "@/shared/lib/date";
import { formatDuration, formatRangoHoras } from "@/shared/lib/format";
import {
  cancelPublicBooking,
  getPublicBookingStatus,
  type PublicBookingStatus,
} from "../services/booking-api";

/** Lo que ve la clienta. "Por confirmar" es mas honesto que "pendiente". */
const ETIQUETA: Record<BookingStatus, string> = {
  PENDING: "Por confirmar",
  CONFIRMED: "Confirmada",
  CANCELLED: "Cancelada",
  COMPLETED: "Atendida",
  NO_SHOW: "No asististe",
};

const EXPLICACION: Record<BookingStatus, string> = {
  PENDING: "Todavía no la hemos confirmado. Te escribimos por WhatsApp en cuanto la revisemos.",
  CONFIRMED: "Tu turno está reservado. Te esperamos.",
  CANCELLED: "Esta cita quedó cancelada. Si fue un error, reserva de nuevo desde el inicio.",
  COMPLETED: "Ya te atendimos. ¡Gracias por venir!",
  NO_SHOW: "Quedó registrada como no asistida. Si hubo un malentendido, escríbenos.",
};

/** Solo tiene sentido cancelar lo que aun no ha pasado. */
const CANCELABLES: BookingStatus[] = ["PENDING", "CONFIRMED"];

export function BookingStatusCard({ token }: { token: string }) {
  const [booking, setBooking] = useState<PublicBookingStatus | null>(null);
  const [estado, setEstado] = useState<"cargando" | "listo" | "error">("cargando");
  const [mensajeError, setMensajeError] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [recarga, setRecarga] = useState(0);
  const { showToast } = useToast();

  useEffect(() => {
    const controller = new AbortController();
    setEstado("cargando");

    getPublicBookingStatus(token, controller.signal)
      .then((datos) => {
        if (controller.signal.aborted) return;
        setBooking(datos);
        setEstado("listo");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setEstado("error");
        setMensajeError(
          error instanceof ApiError && error.status === 400
            ? "No encontramos ninguna cita con ese código. Revisa el enlace que te dimos al reservar."
            : "No pudimos consultar tu cita. Inténtalo de nuevo en un momento.",
        );
      });

    return () => controller.abort();
  }, [token, recarga]);

  const cancelar = useCallback(async () => {
    setCancelando(true);
    try {
      const actualizada = await cancelPublicBooking(token);
      setBooking(actualizada);
      setConfirmando(false);
      showToast({ title: "Tu cita quedó cancelada", description: "El horario vuelve a estar libre." });
    } catch (error) {
      showToast({
        title: "No pudimos cancelar",
        description: error instanceof ApiError ? error.message : "Inténtalo de nuevo.",
        variant: "error",
      });
    } finally {
      setCancelando(false);
    }
  }, [showToast, token]);

  return (
    <main className="mx-auto w-[min(560px,100%)] px-4 py-10 sm:px-6">
      <Link
        className="focus-ring inline-flex items-center gap-2 rounded-full text-sm font-bold text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
        href="/"
      >
        <ArrowLeft aria-hidden="true" className="size-4" /> Volver al inicio
      </Link>

      <h1 className="mt-6 text-3xl font-black tracking-tight">Tu cita</h1>

      <div className="mt-6">
        {estado === "cargando" ? (
          <div className="grid gap-3">
            <Skeleton className="h-8 w-40 rounded-full" />
            <Skeleton className="h-40 rounded-[2rem]" />
          </div>
        ) : estado === "error" ? (
          <div className="grid justify-items-start gap-3 rounded-[2rem] border border-[hsl(var(--danger)/0.32)] bg-[hsl(var(--danger)/0.06)] p-6">
            <p className="flex items-start gap-2 font-bold">
              <AlertCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[hsl(var(--danger))]" />
              {mensajeError}
            </p>
            <Button onClick={() => setRecarga((n) => n + 1)} type="button" variant="secondary">
              <RotateCw aria-hidden="true" className="size-4" /> Reintentar
            </Button>
          </div>
        ) : booking ? (
          <>
            <div className="rounded-[2rem] border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.72)] p-6">
              <span
                className={
                  booking.status === "CANCELLED"
                    ? "rounded-full border border-[hsl(var(--danger)/0.4)] bg-[hsl(var(--danger)/0.1)] px-3 py-1 text-xs font-bold"
                    : "rounded-full border border-[hsl(var(--accent)/0.5)] bg-[hsl(var(--accent)/0.16)] px-3 py-1 text-xs font-bold"
                }
              >
                {ETIQUETA[booking.status]}
              </span>

              <p className="mt-4 text-sm leading-7 text-[hsl(var(--muted))]">
                {EXPLICACION[booking.status]}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <Badge>
                  <CalendarCheck aria-hidden="true" className="size-3.5" />
                  {formatLongDate(booking.scheduledDate.slice(0, 10))}
                </Badge>
                <Badge>
                  <Clock3 aria-hidden="true" className="size-3.5" />
                  {formatRangoHoras(booking.startTime, booking.endTime)}
                </Badge>
                <Badge>{formatDuration(booking.totalDurationMinutes)}</Badge>
              </div>
            </div>

            {CANCELABLES.includes(booking.status) ? (
              <div className="mt-4">
                {confirmando ? (
                  /*
                    La confirmacion se pide en la misma tarjeta y no en un
                    dialogo aparte: cancelar es irreversible, y aqui la pregunta
                    queda al lado de la fecha que se va a perder.
                  */
                  <div className="grid gap-3 rounded-[2rem] border border-[hsl(var(--danger)/0.32)] bg-[hsl(var(--danger)/0.06)] p-5">
                    <p className="font-bold">¿Seguro que quieres cancelar?</p>
                    <p className="text-sm leading-6 text-[hsl(var(--muted))]">
                      El horario queda libre para otra persona y no se puede deshacer. Tendrías que
                      reservar de nuevo.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button disabled={cancelando} onClick={cancelar} type="button">
                        <X aria-hidden="true" className="size-4" />
                        {cancelando ? "Cancelando…" : "Sí, cancelar mi cita"}
                      </Button>
                      <Button
                        disabled={cancelando}
                        onClick={() => setConfirmando(false)}
                        type="button"
                        variant="secondary"
                      >
                        Mejor no
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button className="w-full" onClick={() => setConfirmando(true)} size="lg" type="button" variant="secondary">
                    Cancelar mi cita
                  </Button>
                )}
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </main>
  );
}
