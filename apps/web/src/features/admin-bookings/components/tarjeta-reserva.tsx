"use client";

import { Check, Clock3, House, Phone, Store, UserRound, X } from "lucide-react";
import type { BookingStatus } from "@spa/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/cn";
import { formatDuration, formatHora, formatRangoHoras } from "@/shared/lib/format";
import { restarMinutos, sumarMinutos } from "@/shared/lib/reglas-agenda";
import type { AdminBooking } from "../services/bookings-admin-api";

export const ETIQUETA_ESTADO: Record<BookingStatus, string> = {
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

/**
 * Opciones de traslado.
 *
 * Valores redondos en vez de un campo libre: se elige con el pulgar entre
 * clienta y clienta, y un desplegable corto es mas rapido que teclear. Si el
 * valor guardado no esta en la lista, se anade para no perderlo al abrirlo.
 */
const OPCIONES_TRASLADO = [0, 10, 15, 20, 30, 40, 50, 60, 90];

/**
 * Opciones para una cita concreta.
 *
 * Si el valor guardado no esta en la lista (porque cambio el valor por defecto,
 * o porque se ajusto desde otro sitio), se anade en su orden. Sin esto el
 * desplegable apareceria vacio y el primer cambio pisaria el valor real.
 */
function opcionesTraslado(actual: number) {
  return OPCIONES_TRASLADO.includes(actual)
    ? OPCIONES_TRASLADO
    : [...OPCIONES_TRASLADO, actual].sort((a, b) => a - b);
}

/**
 * Una cita del panel, con sus acciones.
 *
 * La comparten la lista y el calendario: asi confirmar, cancelar o ajustar el
 * traslado funciona igual desde las dos vistas y no hay dos versiones que se
 * desincronicen.
 */
export function TarjetaReserva({
  booking,
  actualizando,
  onCambiarEstado,
  onCambiarTraslado,
}: {
  booking: AdminBooking;
  actualizando: boolean;
  onCambiarEstado: (booking: AdminBooking, nuevo: BookingStatus) => void;
  onCambiarTraslado: (booking: AdminBooking, minutos: number) => void;
}) {
  return (
    <li
      className="grid gap-4 rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.72)] p-4 sm:grid-cols-[1fr_auto] sm:items-center"
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
            <p className="text-xs font-semibold text-[hsl(var(--muted))]">
              {booking.travelBufferMinutes > 0 ? (
                <>
                  Agenda bloqueada de{" "}
                  {formatHora(restarMinutos(booking.startTime, booking.travelBufferMinutes))} a{" "}
                  {formatHora(sumarMinutos(booking.endTime, booking.travelBufferMinutes))}, contando el
                  viaje de ida y vuelta.
                </>
              ) : (
                <>Sin tiempo de traslado reservado.</>
              )}
            </p>

            {/*
              El valor por defecto son 50 minutos, el peor caso,
              porque al reservar nadie sabe donde vive la
              clienta. Al verlo aqui se puede ajustar: bajarlo
              devuelve franjas libres a la agenda.
            */}
            <label className="mt-1 flex flex-wrap items-center gap-2 text-xs font-bold">
              Traslado
              <select
                className="focus-ring min-h-11 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-1 font-semibold"
                disabled={actualizando}
                onChange={(event) => onCambiarTraslado(booking, Number(event.target.value))}
                value={booking.travelBufferMinutes}
              >
                {opcionesTraslado(booking.travelBufferMinutes).map((minutos) => (
                  <option key={minutos} value={minutos}>
                    {minutos === 0 ? "Sin traslado" : formatDuration(minutos)}
                  </option>
                ))}
              </select>
            </label>
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
            disabled={actualizando}
            onClick={() => onCambiarEstado(booking, "CONFIRMED")}
            size="sm"
            type="button"
          >
            <Check aria-hidden="true" className="size-4" /> Confirmar
          </Button>
        ) : null}
        {booking.status === "CONFIRMED" ? (
          <Button
            disabled={actualizando}
            onClick={() => onCambiarEstado(booking, "COMPLETED")}
            size="sm"
            type="button"
          >
            <Check aria-hidden="true" className="size-4" /> Atendida
          </Button>
        ) : null}
        {booking.status === "PENDING" || booking.status === "CONFIRMED" ? (
          <Button
            disabled={actualizando}
            onClick={() => onCambiarEstado(booking, "CANCELLED")}
            size="sm"
            type="button"
            variant="secondary"
          >
            <X aria-hidden="true" className="size-4" /> Cancelar
          </Button>
        ) : null}
      </div>
    </li>
  );
}
