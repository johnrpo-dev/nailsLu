"use client";

import { AlertCircle, CalendarDays, ChevronLeft, ChevronRight, RotateCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { BookingStatus } from "@spa/shared";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/shared/api/client";
import { cn } from "@/shared/lib/cn";
import { formatLongDate, todayIsoDate } from "@/shared/lib/date";
import { useRovingFocus } from "@/shared/lib/use-roving-focus";
import { useAccionesReserva } from "../hooks/use-acciones-reserva";
import { INICIALES_SEMANA, diasDelMes, esDelMes, moverMes, resumenDeCitas, tituloMes } from "../lib/mes";
import { listAdminBookingsEntre, type AdminBooking } from "../services/bookings-admin-api";
import { TarjetaReserva } from "./tarjeta-reserva";

/** Citas visibles por casilla antes de resumir el resto en "+N". */
const MAXIMO_POR_DIA = 3;

/**
 * Color de cada cita en la cuadricula.
 *
 * Confirmada es la unica rellena: es la agenda en firme. Pendiente va con
 * borde y fondo suave porque es la que pide accion. Las cerradas se apagan y
 * la cancelada se tacha, como en Google Calendar: siguen a la vista para que
 * el dia no parezca libre cuando la clienta cancelo hace una hora.
 */
const ESTILO_CHIP: Record<BookingStatus, string> = {
  PENDING: "border border-[hsl(var(--primary)/0.55)] bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--foreground))]",
  CONFIRMED: "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]",
  COMPLETED: "bg-[hsl(var(--surface))] text-[hsl(var(--muted))]",
  NO_SHOW: "bg-[hsl(var(--surface))] text-[hsl(var(--muted))]",
  CANCELLED: "text-[hsl(var(--muted))] line-through",
};

const LEYENDA: { estado: BookingStatus; etiqueta: string }[] = [
  { estado: "PENDING", etiqueta: "Pendiente" },
  { estado: "CONFIRMED", etiqueta: "Confirmada" },
  { estado: "COMPLETED", etiqueta: "Atendida" },
  { estado: "CANCELLED", etiqueta: "Cancelada" },
];

/** "8am", "2:30pm": lo justo para caber en una casilla del celular. */
function horaCorta(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const doce = h % 12 === 0 ? 12 : h % 12;
  return `${doce}${m ? `:${String(m).padStart(2, "0")}` : ""}${h < 12 ? "am" : "pm"}`;
}

function primerNombre(nombreCompleto: string) {
  return nombreCompleto.trim().split(/\s+/)[0] ?? nombreCompleto;
}

/** Hoy si cae en el mes que se mira; si no, el dia 1. */
function diaInicial(ano: number, mes: number, hoy: string) {
  return esDelMes(hoy, ano, mes) ? hoy : `${ano}-${String(mes + 1).padStart(2, "0")}-01`;
}

/**
 * Vista de mes de las reservas, al estilo de Google Calendar.
 *
 * La cuadricula da el panorama —que dias estan llenos— y al tocar un dia se
 * abre debajo su agenda con las mismas tarjetas y acciones de la lista. Asi el
 * calendario no es solo para mirar: desde aqui se confirma y se cancela igual.
 */
export function CalendarioReservas() {
  const [hoy] = useState(() => todayIsoDate());
  const [vista, setVista] = useState(() => ({
    ano: Number(hoy.slice(0, 4)),
    mes: Number(hoy.slice(5, 7)) - 1,
  }));
  const [seleccionado, setSeleccionado] = useState(hoy);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [estado, setEstado] = useState<"loading" | "ready" | "error">("loading");
  const [mensajeError, setMensajeError] = useState("");
  const [recarga, setRecarga] = useState(0);
  const { actualizando, cambiarEstado, cambiarTraslado } = useAccionesReserva(setBookings, false);

  const dias = useMemo(() => diasDelMes(vista.ano, vista.mes), [vista]);

  // Se piden las 42 casillas, no solo el mes: los dias de los meses vecinos
  // tambien se ven en la cuadricula y quedarian vacios aunque tengan citas.
  useEffect(() => {
    const controller = new AbortController();
    setEstado("loading");

    listAdminBookingsEntre(dias[0], dias[dias.length - 1], controller.signal)
      .then((items) => {
        if (controller.signal.aborted) return;
        setBookings(items);
        setEstado("ready");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        // El 401 lo maneja el proveedor de sesion devolviendo al login.
        if (error instanceof ApiError && error.status === 401) return;
        setEstado("error");
        setMensajeError(error instanceof ApiError ? error.message : "No pudimos cargar el calendario.");
      });

    return () => controller.abort();
  }, [dias, recarga]);

  const porDia = useMemo(() => {
    const mapa = new Map<string, AdminBooking[]>();
    for (const booking of bookings) {
      const dia = booking.scheduledDate.slice(0, 10);
      mapa.set(dia, [...(mapa.get(dia) ?? []), booking]);
    }
    // Por hora de inicio, y las canceladas al final: estorban menos abajo.
    for (const lista of mapa.values()) {
      lista.sort(
        (a, b) =>
          Number(a.status === "CANCELLED") - Number(b.status === "CANCELLED") ||
          a.startTime.localeCompare(b.startTime),
      );
    }
    return mapa;
  }, [bookings]);

  const citasDelMes = bookings.filter(
    (booking) => booking.status !== "CANCELLED" && esDelMes(booking.scheduledDate.slice(0, 10), vista.ano, vista.mes),
  ).length;

  const indiceSeleccionado = dias.indexOf(seleccionado);
  const roving = useRovingFocus({ count: dias.length, columns: 7, selectedIndex: indiceSeleccionado });

  function irA(ano: number, mes: number) {
    setVista({ ano, mes });
    setSeleccionado(diaInicial(ano, mes, hoy));
  }

  function elegir(dia: string) {
    setSeleccionado(dia);
    // Un dia del mes vecino lleva a ese mes, como en Google Calendar.
    const ano = Number(dia.slice(0, 4));
    const mes = Number(dia.slice(5, 7)) - 1;
    if (!esDelMes(dia, vista.ano, vista.mes)) setVista({ ano, mes });
  }

  const delSeleccionado = porDia.get(seleccionado) ?? [];

  return (
    <div className="grid gap-5">
      <div className="rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.76)] p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <Button
              aria-label="Mes anterior"
              onClick={() => {
                const previo = moverMes(vista.ano, vista.mes, -1);
                irA(previo.ano, previo.mes);
              }}
              size="icon"
              type="button"
              variant="ghost"
            >
              <ChevronLeft aria-hidden="true" className="size-5" />
            </Button>
            <Button
              aria-label="Mes siguiente"
              onClick={() => {
                const siguiente = moverMes(vista.ano, vista.mes, 1);
                irA(siguiente.ano, siguiente.mes);
              }}
              size="icon"
              type="button"
              variant="ghost"
            >
              <ChevronRight aria-hidden="true" className="size-5" />
            </Button>
            <h2 aria-live="polite" className="ml-1 text-lg font-black capitalize tracking-tight">
              {tituloMes(vista.ano, vista.mes)}
            </h2>
          </div>
          <Button
            disabled={esDelMes(hoy, vista.ano, vista.mes) && seleccionado === hoy}
            onClick={() => irA(Number(hoy.slice(0, 4)), Number(hoy.slice(5, 7)) - 1)}
            size="sm"
            type="button"
            variant="secondary"
          >
            Hoy
          </Button>
        </div>

        <p className="mt-1 px-1 text-sm text-[hsl(var(--muted))]">
          {estado === "loading"
            ? "Cargando citas…"
            : estado === "error"
              ? ""
              : citasDelMes === 1
                ? "1 cita este mes"
                : `${citasDelMes} citas este mes`}
        </p>

        {estado === "error" ? (
          <div className="mt-3 grid justify-items-start gap-3 rounded-2xl border border-[hsl(var(--danger)/0.32)] bg-[hsl(var(--danger)/0.06)] p-4">
            <p className="flex items-start gap-2 text-sm font-bold">
              <AlertCircle aria-hidden="true" className="mt-0.5 size-4 text-[hsl(var(--danger))]" />
              {mensajeError}
            </p>
            <Button onClick={() => setRecarga((n) => n + 1)} size="sm" type="button" variant="secondary">
              <RotateCw aria-hidden="true" className="size-4" /> Reintentar
            </Button>
          </div>
        ) : null}

        <div aria-hidden="true" className="mt-3 grid grid-cols-7 text-center text-xs font-bold uppercase text-[hsl(var(--muted))]">
          {INICIALES_SEMANA.map((inicial, indice) => (
            <span className="py-1" key={indice}>
              {inicial}
            </span>
          ))}
        </div>

        <div
          aria-label={`Días de ${tituloMes(vista.ano, vista.mes)}`}
          className={cn(
            "grid grid-cols-7 overflow-hidden rounded-2xl border-l border-t border-[hsl(var(--border))] transition-opacity",
            estado === "loading" && "opacity-60",
          )}
          role="group"
        >
          {dias.map((dia, indice) => {
            const citas = porDia.get(dia) ?? [];
            const activas = citas.filter((cita) => cita.status !== "CANCELLED").length;
            const canceladas = citas.length - activas;
            const delMes = esDelMes(dia, vista.ano, vista.mes);
            const esHoy = dia === hoy;
            const elegido = dia === seleccionado;
            const sobrantes = citas.length - MAXIMO_POR_DIA;

            return (
              <button
                aria-label={`${formatLongDate(dia)}${esHoy ? ", hoy" : ""}: ${resumenDeCitas(activas, canceladas)}`}
                aria-pressed={elegido}
                className={cn(
                  "focus-ring flex min-h-20 min-w-0 flex-col items-stretch gap-0.5 border-b border-r border-[hsl(var(--border))] p-1 text-left transition-colors sm:min-h-28 sm:p-1.5",
                  delMes ? "bg-[hsl(var(--card))]" : "bg-[hsl(var(--surface)/0.5)]",
                  elegido && "bg-[hsl(var(--primary)/0.07)] ring-2 ring-inset ring-[hsl(var(--primary))]",
                  !elegido && "hover:bg-[hsl(var(--surface))]",
                )}
                data-dia={dia}
                key={dia}
                onClick={() => elegir(dia)}
                onFocus={() => roving.onFocusItem(indice)}
                onKeyDown={(event) => roving.onKeyDown(event, indice)}
                ref={roving.registerRef(indice)}
                tabIndex={roving.getTabIndex(indice)}
                type="button"
              >
                <span
                  className={cn(
                    "mx-auto grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold sm:text-sm",
                    esHoy
                      ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                      : delMes
                        ? "text-[hsl(var(--foreground))]"
                        : "text-[hsl(var(--muted)/0.7)]",
                  )}
                >
                  {Number(dia.slice(8, 10))}
                </span>
                {citas.slice(0, MAXIMO_POR_DIA).map((cita) => (
                  <span
                    className={cn(
                      "block truncate rounded-md px-1 py-px text-[10px] font-semibold leading-4 sm:text-xs sm:leading-5",
                      ESTILO_CHIP[cita.status],
                      !delMes && "opacity-70",
                    )}
                    data-estado={cita.status}
                    key={cita.id}
                  >
                    <span className="hidden sm:inline">{horaCorta(cita.startTime)} </span>
                    {primerNombre(cita.client.fullName)}
                  </span>
                ))}
                {sobrantes > 0 ? (
                  <span className="px-1 text-[10px] font-bold text-[hsl(var(--muted))] sm:text-xs">
                    +{sobrantes} más
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 px-1 text-xs text-[hsl(var(--muted))]">
          {LEYENDA.map(({ estado: clave, etiqueta }) => (
            <li className="flex items-center gap-1.5" key={clave}>
              <span
                aria-hidden="true"
                className={cn(
                  "inline-block h-3 w-5 rounded",
                  ESTILO_CHIP[clave],
                  // Sin borde, atendida y cancelada se confunden con el fondo.
                  clave === "COMPLETED" && "border border-[hsl(var(--border))]",
                  clave === "CANCELLED" && "border border-dashed border-[hsl(var(--border))]",
                )}
              />
              {etiqueta}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="text-sm font-black uppercase tracking-wide text-[hsl(var(--muted))]">
          {formatLongDate(seleccionado)}
          {seleccionado === hoy ? " · hoy" : ""}
        </h2>
        {estado === "ready" && !delSeleccionado.length ? (
          <div className="mt-3 flex items-center gap-3 rounded-3xl border border-dashed border-[hsl(var(--border))] p-5">
            <CalendarDays aria-hidden="true" className="size-5 shrink-0 text-[hsl(var(--muted))]" />
            <p className="text-sm text-[hsl(var(--muted))]">No hay citas este día.</p>
          </div>
        ) : (
          <ul className="mt-3 grid gap-3">
            {delSeleccionado.map((booking) => (
              <TarjetaReserva
                actualizando={actualizando === booking.id}
                booking={booking}
                key={booking.id}
                onCambiarEstado={cambiarEstado}
                onCambiarTraslado={cambiarTraslado}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
