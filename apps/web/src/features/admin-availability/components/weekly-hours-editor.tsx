"use client";

import { Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/shared/api/client";
import { cn } from "@/shared/lib/cn";
import { replaceBusinessHours, type BusinessHour } from "../services/availability-admin-api";

const DIAS = [
  { weekday: 1, nombre: "Lunes" },
  { weekday: 2, nombre: "Martes" },
  { weekday: 3, nombre: "Miércoles" },
  { weekday: 4, nombre: "Jueves" },
  { weekday: 5, nombre: "Viernes" },
  { weekday: 6, nombre: "Sábado" },
  { weekday: 0, nombre: "Domingo" },
];

type Fila = { weekday: number; nombre: string; abierto: boolean; startTime: string; endTime: string };

function aFilas(hours: BusinessHour[]): Fila[] {
  return DIAS.map(({ weekday, nombre }) => {
    const h = hours.find((x) => x.weekday === weekday);
    return {
      weekday,
      nombre,
      abierto: Boolean(h?.isActive),
      startTime: h?.startTime ?? "09:00",
      endTime: h?.endTime ?? "19:00",
    };
  });
}

export function WeeklyHoursEditor({
  hours,
  onSaved,
}: {
  hours: BusinessHour[];
  onSaved: (hours: BusinessHour[]) => void;
}) {
  const [filas, setFilas] = useState<Fila[]>(() => aFilas(hours));
  const [guardando, setGuardando] = useState(false);
  const { showToast } = useToast();

  useEffect(() => setFilas(aFilas(hours)), [hours]);

  const original = useMemo(() => JSON.stringify(aFilas(hours)), [hours]);
  const hayCambios = JSON.stringify(filas) !== original;
  const invalidas = filas.filter((f) => f.abierto && f.endTime <= f.startTime);

  function actualizar(weekday: number, cambio: Partial<Fila>) {
    setFilas((actuales) => actuales.map((f) => (f.weekday === weekday ? { ...f, ...cambio } : f)));
  }

  async function guardar() {
    if (invalidas.length) return;
    setGuardando(true);
    try {
      // Solo se envian los dias abiertos: los cerrados simplemente no existen
      // como tramo horario.
      const actualizados = await replaceBusinessHours(
        filas
          .filter((f) => f.abierto)
          .map((f) => ({ weekday: f.weekday, startTime: f.startTime, endTime: f.endTime, isActive: true })),
      );
      onSaved(actualizados);
      showToast({ title: "Horario actualizado", description: "La agenda pública ya usa los nuevos horarios." });
    } catch (error) {
      showToast({
        title: "No pudimos guardar el horario",
        description: error instanceof ApiError ? error.message : "Intenta de nuevo.",
        variant: "error",
      });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.72)] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black tracking-tight">Horario base</h2>
          <p className="mt-1 max-w-prose text-sm leading-6 text-[hsl(var(--muted))]">
            Los días y horas en que atiendes normalmente. De aquí salen las franjas que ven las clientas.
          </p>
        </div>
        <Button disabled={!hayCambios || guardando || invalidas.length > 0} onClick={guardar} type="button">
          <Save aria-hidden="true" className="size-4" />
          {guardando ? "Guardando..." : "Guardar horario"}
        </Button>
      </div>

      <ul className="mt-4 grid gap-2">
        {filas.map((fila) => {
          const malRango = fila.abierto && fila.endTime <= fila.startTime;
          return (
            <li
              className={cn(
                "grid gap-3 rounded-2xl border p-3 sm:grid-cols-[10rem_1fr] sm:items-center",
                fila.abierto
                  ? "border-[hsl(var(--border))] bg-[hsl(var(--surface)/0.5)]"
                  : "border-dashed border-[hsl(var(--border))]",
              )}
              key={fila.weekday}
            >
              <label className="flex items-center gap-3 text-sm font-bold">
                <input
                  checked={fila.abierto}
                  className="size-5 accent-[hsl(var(--primary))]"
                  onChange={(event) => actualizar(fila.weekday, { abierto: event.target.checked })}
                  type="checkbox"
                />
                {fila.nombre}
              </label>

              {fila.abierto ? (
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    aria-label={`Hora de apertura ${fila.nombre}`}
                    className={horaClass(malRango)}
                    onChange={(event) => actualizar(fila.weekday, { startTime: event.target.value })}
                    type="time"
                    value={fila.startTime}
                  />
                  <span className="text-sm text-[hsl(var(--muted))]">a</span>
                  <input
                    aria-label={`Hora de cierre ${fila.nombre}`}
                    className={horaClass(malRango)}
                    onChange={(event) => actualizar(fila.weekday, { endTime: event.target.value })}
                    type="time"
                    value={fila.endTime}
                  />
                  {malRango ? (
                    <span className="text-xs font-semibold text-[hsl(var(--danger))]">
                      El cierre debe ser después de la apertura
                    </span>
                  ) : null}
                </div>
              ) : (
                <span className="text-sm text-[hsl(var(--muted))]">Cerrado</span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function horaClass(invalid: boolean) {
  return cn(
    "focus-ring rounded-xl border bg-[hsl(var(--card))] px-3 py-2 text-sm font-semibold",
    invalid ? "border-[hsl(var(--danger)/0.6)]" : "border-[hsl(var(--border))]",
  );
}
