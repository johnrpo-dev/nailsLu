"use client";

import { AlertCircle, CalendarDays, List, RotateCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/shared/api/client";
import { cn } from "@/shared/lib/cn";
import { formatLongDate } from "@/shared/lib/date";
import { useAccionesReserva } from "../hooks/use-acciones-reserva";
import { listAdminBookings, type AdminBooking, type BookingScope } from "../services/bookings-admin-api";
import { CalendarioReservas } from "./calendario-reservas";
import { TarjetaReserva } from "./tarjeta-reserva";

const FILTROS: { valor: BookingScope; etiqueta: string }[] = [
  { valor: "active", etiqueta: "Activas" },
  { valor: "today", etiqueta: "Hoy" },
  { valor: "all", etiqueta: "Todas" },
];

type Vista = "calendario" | "lista";

/** Recordar la vista es una comodidad de este navegador: si falla, se abre el calendario. */
const CLAVE_VISTA = "nailslu.reservas.vista";

function leerVista(): Vista {
  try {
    return window.localStorage.getItem(CLAVE_VISTA) === "lista" ? "lista" : "calendario";
  } catch {
    return "calendario";
  }
}

/**
 * Reservas del panel, en dos vistas.
 *
 * El calendario abre por defecto: de un vistazo dice que dias estan llenos,
 * que es la pregunta que Yeri se hace al entrar. La lista se queda para lo que
 * hace mejor, repasar lo pendiente sin ir mes a mes.
 */
export function BookingsBoard() {
  const [vista, setVista] = useState<Vista>("calendario");

  // Se lee al montar y no en el estado inicial: en el servidor no hay
  // localStorage y el primer render tiene que coincidir con el del navegador.
  useEffect(() => {
    setVista(leerVista());
  }, []);

  function cambiarVista(nueva: Vista) {
    setVista(nueva);
    try {
      window.localStorage.setItem(CLAVE_VISTA, nueva);
    } catch {
      // Navegacion privada o almacenamiento bloqueado: solo no se recuerda.
    }
  }

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black tracking-tight">Reservas</h1>
        <div
          aria-label="Vista de reservas"
          className="flex rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.76)] p-1"
          role="group"
        >
          {(
            [
              { valor: "calendario", etiqueta: "Calendario", Icono: CalendarDays },
              { valor: "lista", etiqueta: "Lista", Icono: List },
            ] as const
          ).map(({ valor, etiqueta, Icono }) => (
            <button
              aria-pressed={vista === valor}
              className={cn(
                "focus-ring inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-colors",
                vista === valor
                  ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                  : "text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]",
              )}
              key={valor}
              onClick={() => cambiarVista(valor)}
              type="button"
            >
              <Icono aria-hidden="true" className="size-4" />
              {etiqueta}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">{vista === "calendario" ? <CalendarioReservas /> : <ListaReservas />}</div>
    </section>
  );
}

function ListaReservas() {
  const [scope, setScope] = useState<BookingScope>("active");
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [recarga, setRecarga] = useState(0);
  // En "Activas" una reserva cancelada o atendida ya no pertenece a la lista,
  // asi que desaparece en vez de quedarse desactualizada.
  const { actualizando, cambiarEstado, cambiarTraslado } = useAccionesReserva(setBookings, scope === "active");

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

  const agrupadas = useMemo(() => {
    const mapa = new Map<string, AdminBooking[]>();
    for (const booking of bookings) {
      const dia = booking.scheduledDate.slice(0, 10);
      mapa.set(dia, [...(mapa.get(dia) ?? []), booking]);
    }
    return [...mapa.entries()];
  }, [bookings]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[hsl(var(--muted))]">
          {status === "ready"
            ? bookings.length === 1
              ? "1 reserva"
              : `${bookings.length} reservas`
            : "Cargando agenda"}
        </p>
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
                    <TarjetaReserva
                      actualizando={actualizando === booking.id}
                      booking={booking}
                      key={booking.id}
                      onCambiarEstado={cambiarEstado}
                      onCambiarTraslado={cambiarTraslado}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
