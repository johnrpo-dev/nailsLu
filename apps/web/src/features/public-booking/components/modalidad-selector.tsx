"use client";

import { House, Store } from "lucide-react";
import type { ServiceLocation } from "@spa/shared";
import { cn } from "@/shared/lib/cn";
import { MINUTOS_TRASLADO_DOMICILIO } from "@/shared/lib/reglas-agenda";
import { formatDuration } from "@/shared/lib/format";

/**
 * Spa o domicilio.
 *
 * Va por encima del calendario y no dentro del formulario de contacto, aunque
 * ahi empezo: a domicilio cada cita ocupa tambien el traslado, asi que la
 * modalidad cambia que horas quedan libres. Preguntarla despues de elegir la
 * hora obligaria a volver atras cuando la franja escogida deja de existir.
 *
 * Ninguna opcion viene marcada. Preseleccionar el spa seria mas comodo, pero
 * quien quiere domicilio y no se fija acabaria con la cita en el sitio
 * equivocado.
 */
export function ModalidadSelector({
  value,
  onChange,
}: {
  value: "" | ServiceLocation;
  onChange: (valor: ServiceLocation) => void;
}) {
  return (
    <fieldset className="rounded-[2rem] bg-[hsl(var(--surface)/0.68)] p-4">
      <legend className="sr-only">¿Dónde quieres el servicio?</legend>
      <p className="text-xs font-bold uppercase text-[hsl(var(--muted))]">¿Dónde te atendemos?</p>

      <div className="mt-3 grid grid-cols-2 gap-2" role="radiogroup">
        {[
          { valor: "SPA" as const, etiqueta: "En el spa", Icono: Store },
          { valor: "DOMICILIO" as const, etiqueta: "A domicilio", Icono: House },
        ].map(({ valor, etiqueta, Icono }) => {
          const elegido = value === valor;
          return (
            <button
              aria-checked={elegido}
              className={cn(
                "focus-ring flex min-h-12 items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-sm font-black transition",
                elegido
                  ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.14)]"
                  : "border-[hsl(var(--border))] bg-[hsl(var(--card)/0.7)] hover:border-[hsl(var(--primary)/0.45)]",
              )}
              key={valor}
              onClick={() => onChange(valor)}
              role="radio"
              type="button"
            >
              <Icono aria-hidden="true" className="size-4 shrink-0" />
              {etiqueta}
            </button>
          );
        })}
      </div>

      <p aria-live="polite" className="mt-3 text-sm leading-6 text-[hsl(var(--muted))]">
        {value === "DOMICILIO" ? (
          <>
            Vamos hasta donde estés. Reservamos {formatDuration(MINUTOS_TRASLADO_DOMICILIO)} antes y
            después de tu cita para el desplazamiento, así que verás menos horarios disponibles.
          </>
        ) : value === "SPA" ? (
          "Te esperamos en el spa."
        ) : (
          "Elige una opción para ver los horarios libres."
        )}
      </p>
    </fieldset>
  );
}
