"use client";

import { AlertCircle, RotateCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/shared/api/client";
import {
  listBlocks,
  listBusinessHours,
  type AvailabilityBlock,
  type BusinessHour,
} from "../services/availability-admin-api";
import { BlocksEditor } from "./blocks-editor";
import { WeeklyHoursEditor } from "./weekly-hours-editor";

export function AvailabilityManager() {
  const [hours, setHours] = useState<BusinessHour[]>([]);
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");

    Promise.all([listBusinessHours(controller.signal), listBlocks(controller.signal)])
      .then(([h, b]) => {
        if (controller.signal.aborted) return;
        setHours(h);
        setBlocks(b);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (error instanceof ApiError && error.status === 401) return;
        setStatus("error");
        setErrorMessage(error instanceof ApiError ? error.message : "No pudimos cargar la disponibilidad.");
      });

    return () => controller.abort();
  }, [recarga]);

  return (
    <section>
      <div>
        <h1 className="text-2xl font-black tracking-tight">Disponibilidad</h1>
        <p className="mt-1 max-w-prose text-sm text-[hsl(var(--muted))]">
          Define cuándo atiendes. Las clientas solo ven horas libres dentro de tu jornada que no choquen con
          otra reserva.
        </p>
      </div>

      <div className="mt-5 grid gap-4">
        {status === "loading" ? (
          <>
            <Skeleton className="h-80 rounded-3xl" />
            <Skeleton className="h-64 rounded-3xl" />
          </>
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
        ) : (
          <>
            <WeeklyHoursEditor hours={hours} onSaved={setHours} />
            <BlocksEditor blocks={blocks} hours={hours} onChange={setBlocks} />
          </>
        )}
      </div>
    </section>
  );
}
