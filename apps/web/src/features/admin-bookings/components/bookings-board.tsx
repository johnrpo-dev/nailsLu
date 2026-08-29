"use client";

import { AlertCircle, CalendarDays, Check, Clock3, House, Phone, RotateCw, Store, UserRound, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { BookingStatus } from "@spa/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/shared/api/client";
import { cn } from "@/shared/lib/cn";
import { formatLongDate } from "@/shared/lib/date";
import { formatDuration, formatHora, formatRangoHoras } from "@/shared/lib/format";
import { restarMinutos, sumarMinutos } from "@/shared/lib/reglas-agenda";
import {
  listAdminBookings,
  updateBookingStatus,
  type AdminBooking,
  type BookingScope,
} from "../services/bookings-admin-api";

const FILTROS: { valor: BookingScope; etiqueta: string }[] = [
  { valor: "active", etiqueta: "Activas" },
  { valor: "today", etiqueta: "Hoy" },
  { valor: "all", etiqueta: "Todas" },
];

const ETIQUETA_ESTADO: Record<BookingStatus, string> = {
  PENDING: "Por confirmar",
  CONFIRMED: "Confirmada",
  CANCELLED: "Cancelada",
  COMPLETED: "Atendida",
  NO_SHOW: "No asistió",
};

const ESTILO_ESTADO: Record<BookingStatus, string> = {
  PENDING: "border-[hsl(var(--border))] bg-[hsl(var(--surface))] text-[hsl(var(--foreground))]",
  CONFIRMED: "border-[hsl(var(--accent)/0.5)] bg-[hsl(var(--accent)/0.16)] text-[hsl(var(--foreground))]",
  CANCELLED: "border-[hsl(var(--danger)/0.4)] bg-[hsl(var(--danger)/0.1)] text-[hsl(var(--foreground))]",
  COMPLETED: "border-[hsl(var(--border))] bg-[hsl(var(--surface))] text-[hsl(var(--muted))]",
  NO_SHOW: "border-[hsl(var(--border))] bg-[hsl(var(--surface))] text-[hsl(var(--muted))]",
};

export function BookingsBoard() {
  const [scope, setScope] = useState<BookingScope>("active");
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [actualizando, setActualizando] = useState<string | null>(null);
  const [recarga, setRecarga] = useState(0);
  const { showToast } = useToast();

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");

    listAdminBookings(scope, controller.signal)
      .then((items) => {
        if (controller.signal.aborted) return;
        setBookings(items);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        // El 401 lo maneja el proveedor de sesion devolviendo al login.
        if (error instanceof ApiError && error.status === 401) return;
        setStatus("error");
        setErrorMessage(error instanceof ApiError ? error.message : "No pudimos cargar las reservas.");
      });

    return () => controller.abort();
  }, [scope, recarga]);

  const cambiarEstado = useCallback(
    async (booking: AdminBooking, nuevo: BookingStatus) => {
      setActualizando(booking.id);
      try {
        const actualizada = await updateBookingStatus(booking.id, nuevo);
        setBookings((actuales) =>
          // En "Activas" una reserva cancelada o atendida ya no pertenece a la
          // lista, asi que desaparece en vez de quedarse desactualizada.
          scope === "active" && (nuevo === "CANCELLED" || nuevo === "COMPLETED" || nuevo === "NO_SHOW")
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
    [scope, showToast],
  );

  const agrupadas = useMemo(() => {
    const mapa = new Map<string, AdminBooking[]>();
    for (const booking of bookings) {
      const dia = booking.scheduledDate.slice(0, 10);
      mapa.set(dia, [...(mapa.get(dia) ?? []), booking]);
    }
    return [...mapa.entries()];
  }, [bookings]);

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Reservas</h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted))]">
            {status === "ready"
              ? bookings.length === 1
                ? "1 reserva"
                : `${bookings.length} reservas`
              : "Cargando agenda"}
          </p>
        </div>
        <div className="flex gap-2" role="group" aria-label="Filtrar reservas">
          {FILTROS.map((filtro) => (
            <Button
              aria-pressed={scope === filtro.valor}
              key={filtro.valor}
              onClick={() => setScope(filtro.valor)}
              size="sm"
              type="button"
              variant={scope === filtro.valor ? "primary" : "secondary"}
            >
              {filtro.etiqueta}
            </Button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        {status === "loading" ? (
          <div className="grid gap-3">
            {[1, 2, 3].map((item) => (
              <Skeleton className="h-28 rounded-3xl" key={item} />
            ))}
          </div>
        ) : status === "error" ? (
          <div className="grid justify-items-start gap-3 rounded-3xl border border-[hsl(var(--danger)/0.32)] bg-[hsl(var(--danger)/0.06)] p-6">
            <p className="flex items-start gap-2 font-bold">
              <AlertCircle aria-hidden="true" className="mt-0.5 size-5 text-[hsl(var(--danger))]" />
              {errorMessage}
            </p>
            <Button onClick={() => setRecarga((n) => n + 1)} type="button" variant="secondary">
              <RotateCw aria-hidden="true" className="size-4" /> Reintentar
            </Button>
          </div>
        ) : !bookings.length ? (
          <div className="grid justify-items-start gap-2 rounded-3xl border border-dashed border-[hsl(var(--border))] p-8">
            <CalendarDays aria-hidden="true" className="size-6 text-[hsl(var(--muted))]" />
            <p className="text-base font-bold">
              {scope === "today" ? "No hay citas para hoy" : "No hay reservas activas"}
            </p>
            <p className="max-w-prose text-sm leading-7 text-[hsl(var(--muted))]">
              Cuando una clienta reserve desde el sitio, la verás aquí al instante.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {agrupadas.map(([dia, delDia]) => (
              <div key={dia}>
                <h2 className="text-sm font-black uppercase tracking-wide text-[hsl(var(--muted))]">
                  {formatLongDate(dia)}
                </h2>
                <ul className="mt-3 grid gap-3">
                  {delDia.map((booking) => (
                    <li
                      className="grid gap-4 rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.72)] p-4 sm:grid-cols-[1fr_auto] sm:items-center"
                      key={booking.id}
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "rounded-full border px-3 py-1 text-xs font-bold",
                              ESTILO_ESTADO[booking.status],
                            )}
                          >
                            {ETIQUETA_ESTADO[booking.status]}
                          </span>
                          <Badge>
                            <Clock3 aria-hidden="true" className="size-3.5" />
                            {formatRangoHoras(booking.startTime, booking.endTime)}
                          </Badge>
                          <Badge>{formatDuration(booking.totalDurationMinutes)}</Badge>
                        </div>

                        <p className="mt-3 flex items-center gap-2 text-lg font-black">
                          <UserRound aria-hidden="true" className="size-4 text-[hsl(var(--muted))]" />
                          {booking.client.fullName}
                        </p>
                        <a
                          className="focus-ring mt-1 inline-flex items-center gap-2 rounded-full text-sm font-semibold text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
                          href={`https://wa.me/57${booking.client.phone}`}
                          rel="noreferrer"
                          target="_blank"
                        >
                          <Phone aria-hidden="true" className="size-3.5" />
                          {booking.client.phone}
                        </a>

                        <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted))]">
                          {booking.services.map((s) => s.serviceNameSnapshot).join(", ")}
                        </p>

                        {/*
                          El domicilio se destaca porque cambia su jornada: hay
                          que salir, desplazarse y volver. Una cita en el spa es
                          lo normal y no necesita gritar.
                        */}
                        {booking.serviceLocation === "DOMICILIO" ? (
                          <div className="mt-3 grid gap-1 rounded-2xl border border-[hsl(var(--accent)/0.5)] bg-[hsl(var(--accent)/0.14)] p-3">
                            <p className="flex items-center gap-2 text-sm font-black">
                              <House aria-hidden="true" className="size-4 shrink-0" /> A domicilio
                            </p>
                            {/*
                              El traslado se muestra porque explica un hueco en
                              la agenda que si no pareceria tiempo libre: la
                              siguiente cita no empieza cuando termina esta.
                            */}
                            {booking.travelBufferMinutes > 0 ? (
                              <p className="text-xs font-semibold text-[hsl(var(--muted))]">
                                Agenda bloqueada de{" "}
                                {formatHora(restarMinutos(booking.startTime, booking.travelBufferMinutes))} a{" "}
                                {formatHora(sumarMinutos(booking.endTime, booking.travelBufferMinutes))}, con el
                                traslado de ida y vuelta ({formatDuration(booking.travelBufferMinutes)} cada uno).
                              </p>
                            ) : null}
                            {booking.address ? (
                              <a
                                className="focus-ring rounded-xl text-sm leading-6 underline decoration-dotted underline-offset-4"
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.address)}`}
                                rel="noreferrer"
                                target="_blank"
                              >
                                {booking.address}
                              </a>
                            ) : null}
                          </div>
                        ) : (
                          <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-[hsl(var(--muted))]">
                            <Store aria-hidden="true" className="size-3.5 shrink-0" /> En el spa
                          </p>
                        )}
                        {booking.notes ? (
                          <p className="mt-2 rounded-2xl bg-[hsl(var(--surface)/0.7)] p-3 text-sm leading-6">
                            {booking.notes}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap gap-2 sm:justify-end">
                        {booking.status === "PENDING" ? (
                          <Button
                            disabled={actualizando === booking.id}
                            onClick={() => cambiarEstado(booking, "CONFIRMED")}
                            size="sm"
                            type="button"
                          >
                            <Check aria-hidden="true" className="size-4" /> Confirmar
                          </Button>
                        ) : null}
                        {booking.status === "CONFIRMED" ? (
                          <Button
                            disabled={actualizando === booking.id}
                            onClick={() => cambiarEstado(booking, "COMPLETED")}
                            size="sm"
                            type="button"
                          >
                            <Check aria-hidden="true" className="size-4" /> Atendida
                          </Button>
                        ) : null}
                        {booking.status === "PENDING" || booking.status === "CONFIRMED" ? (
                          <Button
                            disabled={actualizando === booking.id}
                            onClick={() => cambiarEstado(booking, "CANCELLED")}
                            size="sm"
                            type="button"
                            variant="secondary"
                          >
                            <X aria-hidden="true" className="size-4" /> Cancelar
                          </Button>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
