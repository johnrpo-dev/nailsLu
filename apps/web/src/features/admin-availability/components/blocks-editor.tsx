"use client";

import { CalendarOff, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/shared/api/client";
import { cn } from "@/shared/lib/cn";
import { formatLongDate, todayIsoDate } from "@/shared/lib/date";
import { formatRangoHoras } from "@/shared/lib/format";
import { createBlock, deleteBlock, type AvailabilityBlock } from "../services/availability-admin-api";

const JORNADA = { inicio: "00:00", fin: "23:59" };

export function BlocksEditor({
  blocks,
  onChange,
}: {
  blocks: AvailabilityBlock[];
  onChange: (blocks: AvailabilityBlock[]) => void;
}) {
  const [date, setDate] = useState(todayIsoDate);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("19:00");
  const [reason, setReason] = useState("");
  const [todoElDia, setTodoElDia] = useState(true);
  const [type, setType] = useState<"BLOCKED" | "AVAILABLE">("BLOCKED");
  const [guardando, setGuardando] = useState(false);
  const [borrando, setBorrando] = useState<string | null>(null);
  const { showToast } = useToast();

  const desde = todoElDia ? JORNADA.inicio : startTime;
  const hasta = todoElDia ? JORNADA.fin : endTime;
  const rangoValido = hasta > desde;

  async function agregar() {
    if (!rangoValido) return;
    setGuardando(true);
    try {
      const creado = await createBlock({ date, startTime: desde, endTime: hasta, type, reason: reason.trim() || undefined });
      onChange([...blocks, creado].sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)));
      setReason("");
      showToast({
        title: type === "BLOCKED" ? "Franja cerrada" : "Franja abierta",
        description:
          type === "BLOCKED"
            ? "Deja de ofrecerse a las clientas."
            : "Se ofrece aunque quede fuera del horario base.",
      });
    } catch (error) {
      showToast({
        title: "No pudimos guardar",
        description: error instanceof ApiError ? error.message : "Intenta de nuevo.",
        variant: "error",
      });
    } finally {
      setGuardando(false);
    }
  }

  async function quitar(block: AvailabilityBlock) {
    setBorrando(block.id);
    try {
      await deleteBlock(block.id);
      onChange(blocks.filter((b) => b.id !== block.id));
      showToast({ title: "Excepción eliminada" });
    } catch (error) {
      showToast({
        title: "No pudimos eliminarla",
        description: error instanceof ApiError ? error.message : "Intenta de nuevo.",
        variant: "error",
      });
    } finally {
      setBorrando(null);
    }
  }

  return (
    <section className="rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.72)] p-4 sm:p-5">
      <div>
        <h2 className="text-lg font-black tracking-tight">Excepciones por fecha</h2>
        <p className="mt-1 max-w-prose text-sm leading-6 text-[hsl(var(--muted))]">
          Cierra un festivo o una tarde suelta, o abre un día que normalmente no atiendes. Manda sobre el horario base.
        </p>
      </div>

      <div className="mt-4 grid gap-3 rounded-2xl bg-[hsl(var(--surface)/0.5)] p-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Tipo de excepción">
          <Button
            aria-pressed={type === "BLOCKED"}
            onClick={() => setType("BLOCKED")}
            size="sm"
            type="button"
            variant={type === "BLOCKED" ? "primary" : "secondary"}
          >
            Cerrar
          </Button>
          <Button
            aria-pressed={type === "AVAILABLE"}
            onClick={() => setType("AVAILABLE")}
            size="sm"
            type="button"
            variant={type === "AVAILABLE" ? "primary" : "secondary"}
          >
            Abrir
          </Button>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <label className="grid gap-1 text-xs font-bold text-[hsl(var(--muted))]">
            Fecha
            <input
              className={campoClass}
              min={todayIsoDate()}
              onChange={(event) => setDate(event.target.value)}
              type="date"
              value={date}
            />
          </label>

          <label className="flex items-center gap-2 text-sm font-bold">
            <input
              checked={todoElDia}
              className="size-5 accent-[hsl(var(--primary))]"
              onChange={(event) => setTodoElDia(event.target.checked)}
              type="checkbox"
            />
            Todo el día
          </label>

          {!todoElDia ? (
            <>
              <label className="grid gap-1 text-xs font-bold text-[hsl(var(--muted))]">
                Desde
                <input
                  className={campoClass}
                  onChange={(event) => setStartTime(event.target.value)}
                  type="time"
                  value={startTime}
                />
              </label>
              <label className="grid gap-1 text-xs font-bold text-[hsl(var(--muted))]">
                Hasta
                <input
                  className={campoClass}
                  onChange={(event) => setEndTime(event.target.value)}
                  type="time"
                  value={endTime}
                />
              </label>
            </>
          ) : null}
        </div>

        <label className="grid gap-1 text-xs font-bold text-[hsl(var(--muted))]">
          Motivo (opcional)
          <input
            className={campoClass}
            maxLength={140}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Festivo, cita médica, viaje..."
            value={reason}
          />
        </label>

        {!rangoValido ? (
          <p className="text-xs font-semibold text-[hsl(var(--danger))]">La hora de fin debe ser posterior a la de inicio.</p>
        ) : null}

        <Button className="justify-self-start" disabled={guardando || !rangoValido} onClick={agregar} type="button">
          <Plus aria-hidden="true" className="size-4" />
          {guardando ? "Guardando..." : type === "BLOCKED" ? "Cerrar franja" : "Abrir franja"}
        </Button>
      </div>

      {blocks.length ? (
        <ul className="mt-4 grid gap-2">
          {blocks.map((block) => {
            const todoElDiaBloque = block.startTime === JORNADA.inicio && block.endTime === JORNADA.fin;
            return (
              <li
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[hsl(var(--border))] p-3"
                key={block.id}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-bold",
                        block.type === "BLOCKED"
                          ? "border-[hsl(var(--danger)/0.4)] bg-[hsl(var(--danger)/0.1)]"
                          : "border-[hsl(var(--accent)/0.5)] bg-[hsl(var(--accent)/0.16)]",
                      )}
                    >
                      {block.type === "BLOCKED" ? "Cerrado" : "Abierto"}
                    </span>
                    <Badge>{todoElDiaBloque ? "Todo el día" : formatRangoHoras(block.startTime, block.endTime)}</Badge>
                  </div>
                  <p className="mt-2 text-sm font-bold">{formatLongDate(block.date.slice(0, 10))}</p>
                  {block.reason ? (
                    <p className="text-sm text-[hsl(var(--muted))]">{block.reason}</p>
                  ) : null}
                </div>
                <Button
                  aria-label="Eliminar excepción"
                  disabled={borrando === block.id}
                  onClick={() => quitar(block)}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  <Trash2 aria-hidden="true" className="size-4" /> Quitar
                </Button>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-4 grid justify-items-start gap-2 rounded-2xl border border-dashed border-[hsl(var(--border))] p-6">
          <CalendarOff aria-hidden="true" className="size-5 text-[hsl(var(--muted))]" />
          <p className="text-sm font-bold">Sin excepciones próximas</p>
          <p className="max-w-prose text-sm leading-6 text-[hsl(var(--muted))]">
            Se aplica el horario base de arriba todos los días.
          </p>
        </div>
      )}
    </section>
  );
}

const campoClass = cn(
  "focus-ring rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]",
  "px-3 py-2 text-sm font-semibold",
);
