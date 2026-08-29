"use client";

import { CalendarHeart } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatLongDate } from "@/shared/lib/date";
import { listHolidays, type Holiday } from "../services/availability-admin-api";
import type { AvailabilityBlock } from "../services/availability-admin-api";

/**
 * Proximos festivos de Colombia.
 *
 * Se cierran solos, asi que esto no es una tarea pendiente: es para que no la
 * sorprenda un lunes sin citas y para que decida si va a trabajar alguno.
 *
 * Abrir un festivo se hace con una excepcion "Disponible" en el formulario de
 * abajo, que es el mismo mecanismo de siempre; aqui solo se avisa de cuales ya
 * estan abiertos para que no parezca que el aviso miente.
 */
export function HolidaysList({ blocks }: { blocks: AvailabilityBlock[] }) {
  const [festivos, setFestivos] = useState<Holiday[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    listHolidays(controller.signal)
      .then((datos) => {
        if (controller.signal.aborted) return;
        setFestivos(datos);
        setCargando(false);
      })
      .catch(() => {
        // Es informativo: si falla, la seccion no aparece y el resto del panel
        // sigue funcionando igual.
        if (!controller.signal.aborted) setCargando(false);
      });
    return () => controller.abort();
  }, []);

  if (!cargando && !festivos.length) return null;

  const abiertos = new Set(
    blocks.filter((b) => b.type === "AVAILABLE").map((b) => b.date.slice(0, 10)),
  );

  return (
    <section className="rounded-[2rem] border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.72)] p-4">
      <div className="flex items-center gap-2">
        <CalendarHeart aria-hidden="true" className="size-4 text-[hsl(var(--muted))]" />
        <h2 className="text-xl font-black tracking-tight">Próximos festivos</h2>
      </div>
      <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted))]">
        Estos días la agenda se cierra sola y nadie puede reservar. Si vas a trabajar alguno, ábrelo
        abajo con una excepción <strong className="text-[hsl(var(--foreground))]">Disponible</strong> y
        las horas que quieras atender.
      </p>

      {cargando ? (
        <div className="mt-4 grid gap-2">
          {[1, 2, 3].map((n) => (
            <Skeleton className="h-10 rounded-2xl" key={n} />
          ))}
        </div>
      ) : (
        <ul className="mt-4 grid gap-2">
          {festivos.map((festivo) => (
            <li
              className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-[hsl(var(--surface)/0.6)] px-4 py-3"
              key={festivo.date}
            >
              <div className="min-w-0">
                <p className="text-sm font-black">{festivo.name}</p>
                <p className="text-xs text-[hsl(var(--muted))]">{formatLongDate(festivo.date)}</p>
              </div>
              {abiertos.has(festivo.date) ? (
                <Badge>Abierto por ti</Badge>
              ) : (
                <span className="text-xs font-bold text-[hsl(var(--muted))]">Cerrado</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
