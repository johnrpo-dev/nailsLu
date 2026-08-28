"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertCircle, CalendarDays, Clock3, RotateCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/shared/api/client";
import { cn } from "@/shared/lib/cn";
import { createRollingDays } from "@/shared/lib/date";
import { formatDuration } from "@/shared/lib/format";
import { useRovingFocus } from "@/shared/lib/use-roving-focus";
import { getAvailability } from "../services/booking-api";

type Status = "idle" | "loading" | "ready" | "error";

const DAY_COLUMNS = 7;
const SLOT_COLUMNS = 4;

export function DateTimePicker({
  durationMinutes,
  date,
  time,
  onDateChange,
  onTimeChange,
}: {
  durationMinutes: number;
  date: string;
  time: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
}) {
  const [slots, setSlots] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [reloadToken, setReloadToken] = useState(0);
  const reducedMotion = useReducedMotion();
  const days = useMemo(() => createRollingDays(14), []);

  // onTimeChange se guarda en ref para que el efecto dependa solo de los datos
  // de la consulta: si el padre recrea el callback, no se refetchea de mas.
  const onTimeChangeRef = useRef(onTimeChange);
  useEffect(() => {
    onTimeChangeRef.current = onTimeChange;
  }, [onTimeChange]);

  const selectedTimeRef = useRef(time);
  useEffect(() => {
    selectedTimeRef.current = time;
  }, [time]);

  useEffect(() => {
    if (!durationMinutes) {
      setSlots([]);
      setStatus("idle");
      onTimeChangeRef.current("");
      return;
    }

    const controller = new AbortController();
    setStatus("loading");

    getAvailability(date, durationMinutes, controller.signal)
      .then((response) => {
        if (controller.signal.aborted) return;
        setSlots(response.slots);
        setStatus("ready");
        // Se conserva la hora elegida si sigue libre; si no, se limpia en vez
        // de mover a la clienta a un horario que no pidio.
        const current = selectedTimeRef.current;
        onTimeChangeRef.current(current && response.slots.includes(current) ? current : "");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setSlots([]);
        setStatus("error");
        onTimeChangeRef.current("");
        setErrorMessage(
          error instanceof ApiError && error.isNetworkError
            ? "No pudimos conectar con la agenda."
            : "No pudimos cargar los horarios.",
        );
      });

    // Cancela la peticion anterior: al cambiar de dia rapido, una respuesta
    // lenta ya no puede pisar la grilla del dia actual.
    return () => controller.abort();
  }, [date, durationMinutes, reloadToken]);

  const selectedDayIndex = days.findIndex((day) => day.iso === date);
  const dayFocus = useRovingFocus({ count: days.length, columns: DAY_COLUMNS, selectedIndex: selectedDayIndex });
  const selectedSlotIndex = slots.indexOf(time);
  const slotFocus = useRovingFocus({ count: slots.length, columns: SLOT_COLUMNS, selectedIndex: selectedSlotIndex });

  const retry = useCallback(() => setReloadToken((token) => token + 1), []);

  return (
    <section
      aria-labelledby="agenda-heading"
      className="rounded-[2rem] border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.72)] p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase text-[hsl(var(--muted))]">Agenda</p>
          <h2 className="mt-1 text-xl font-black tracking-tight" id="agenda-heading">
            Fecha y hora
          </h2>
        </div>
        <Badge>
          <Clock3 aria-hidden="true" className="size-3.5" />
          {durationMinutes ? formatDuration(durationMinutes) : "Sin servicios"}
        </Badge>
      </div>

      <div
        aria-label="Días disponibles"
        className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-7"
        role="listbox"
      >
        {days.map((day, index) => {
          const selected = day.iso === date;
          return (
            <button
              aria-label={`${day.weekday} ${day.day} de ${day.month}${day.isToday ? ", hoy" : ""}`}
              aria-selected={selected}
              className={cn(
                "focus-ring rounded-2xl border p-3 text-left transition duration-300",
                selected
                  ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.12)]"
                  : "border-[hsl(var(--border))] bg-[hsl(var(--surface)/0.54)] hover:border-[hsl(var(--primary)/0.42)]",
              )}
              key={day.iso}
              onClick={() => onDateChange(day.iso)}
              onFocus={() => dayFocus.onFocusItem(index)}
              onKeyDown={(event) => dayFocus.onKeyDown(event, index)}
              ref={dayFocus.registerRef(index)}
              role="option"
              tabIndex={dayFocus.getTabIndex(index)}
              type="button"
            >
              <span aria-hidden="true" className="block text-xs font-bold uppercase text-[hsl(var(--muted))]">
                {day.isToday ? "Hoy" : day.weekday}
              </span>
              <span aria-hidden="true" className="mt-1 block text-lg font-black">
                {day.day}
              </span>
              <span aria-hidden="true" className="block text-xs text-[hsl(var(--muted))]">
                {day.month}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-5">
        <div className="mb-3 flex items-center gap-2 text-sm font-bold text-[hsl(var(--muted))]" id="slots-label">
          <CalendarDays aria-hidden="true" className="size-4" /> Franjas disponibles
        </div>

        {/* Los cambios de disponibilidad se anuncian sin robar el foco. */}
        <p aria-live="polite" className="sr-only">
          {status === "loading"
            ? "Buscando horarios disponibles."
            : status === "ready"
              ? `${slots.length} horarios disponibles.`
              : status === "error"
                ? errorMessage
                : ""}
        </p>

        {status === "loading" ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <Skeleton className="h-12 rounded-full" key={item} />
            ))}
          </div>
        ) : status === "error" ? (
          <div className="grid gap-3 rounded-3xl border border-[hsl(var(--danger)/0.32)] bg-[hsl(var(--danger)/0.06)] p-5">
            <p className="flex items-start gap-2 text-sm font-semibold">
              <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[hsl(var(--danger))]" />
              {errorMessage}
            </p>
            <p className="text-sm leading-6 text-[hsl(var(--muted))]">
              Preferimos no mostrarte horarios que quizá no existan. Reinténtalo en un momento.
            </p>
            <Button className="justify-self-start" onClick={retry} size="sm" type="button" variant="secondary">
              <RotateCw aria-hidden="true" className="size-4" /> Reintentar
            </Button>
          </div>
        ) : status === "idle" ? (
          <div className="rounded-3xl border border-dashed border-[hsl(var(--border))] p-5 text-sm leading-6 text-[hsl(var(--muted))]">
            Elige al menos un servicio y te mostramos las horas libres.
          </div>
        ) : slots.length ? (
          <motion.div
            aria-labelledby="slots-label"
            className="grid grid-cols-3 gap-2 sm:grid-cols-4"
            layout={!reducedMotion}
            role="radiogroup"
          >
            <AnimatePresence initial={false} mode="popLayout">
              {slots.map((slot, index) => {
                const selected = slot === time;
                return (
                  <motion.button
                    animate={{ opacity: 1, scale: 1 }}
                    aria-checked={selected}
                    className={cn(
                      "focus-ring rounded-full border px-4 py-3 text-sm font-black transition duration-300",
                      selected
                        ? "border-[hsl(var(--accent))] bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]"
                        : "border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-[hsl(var(--accent)/0.5)]",
                    )}
                    exit={reducedMotion ? undefined : { opacity: 0, scale: 0.94 }}
                    initial={reducedMotion ? false : { opacity: 0, scale: 0.94 }}
                    key={slot}
                    layout={!reducedMotion}
                    onClick={() => onTimeChange(slot)}
                    onFocus={() => slotFocus.onFocusItem(index)}
                    onKeyDown={(event: KeyboardEvent<HTMLButtonElement>) => slotFocus.onKeyDown(event, index)}
                    ref={slotFocus.registerRef(index)}
                    role="radio"
                    tabIndex={slotFocus.getTabIndex(index)}
                    transition={reducedMotion ? { duration: 0 } : undefined}
                    type="button"
                  >
                    {slot}
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="rounded-3xl border border-dashed border-[hsl(var(--border))] p-5 text-sm leading-6 text-[hsl(var(--muted))]">
            No hay espacios para esta duración. Prueba otro día o quita un servicio.
          </div>
        )}
      </div>
    </section>
  );
}
