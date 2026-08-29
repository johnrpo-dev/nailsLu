"use client";

import { CalendarClock, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { leerUltimaReserva, type UltimaReserva } from "@/shared/lib/ultima-reserva";

/**
 * Acceso a la ultima cita reservada desde este navegador.
 *
 * Aparece solo si hay una guardada y todavia no ha pasado. Se lee en un efecto
 * y no durante el render porque `localStorage` no existe en el servidor: si se
 * pintara en ambos sitios, el HTML del servidor y el del cliente no
 * coincidirian.
 */
export function UltimaReservaAviso() {
  const [reserva, setReserva] = useState<UltimaReserva | null>(null);

  useEffect(() => {
    setReserva(leerUltimaReserva());
  }, []);

  if (!reserva) return null;

  return (
    <Link
      className="focus-ring group flex items-center gap-3 rounded-full border border-[hsl(var(--accent)/0.4)] bg-[hsl(var(--accent)/0.12)] px-4 py-3 text-sm font-bold transition hover:border-[hsl(var(--accent))]"
      href={`/reserva/${reserva.token}`}
    >
      <CalendarClock aria-hidden="true" className="size-4 shrink-0" />
      <span className="min-w-0 flex-1">Ya tienes una cita reservada. Consúltala o cancélala.</span>
      <ChevronRight
        aria-hidden="true"
        className="size-4 shrink-0 transition group-hover:translate-x-0.5"
      />
    </Link>
  );
}
