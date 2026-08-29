"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDuration, formatHora } from "@/shared/lib/format";

/**
 * Barra fija en movil.
 *
 * En pantallas chicas el panel de reserva queda debajo de todo el catalogo, asi
 * que el resumen viaja con la clienta y la lleva al formulario de un toque.
 * A partir de lg el panel ya es sticky y esta barra sobra.
 */
export function MobileSummaryBar({
  selectedCount,
  durationMinutes,
  time,
}: {
  selectedCount: number;
  durationMinutes: number;
  time: string;
}) {
  const reducedMotion = useReducedMotion();
  const visible = selectedCount > 0;

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          animate={{ y: 0, opacity: 1 }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-[hsl(var(--border))] bg-[hsl(var(--card)/0.92)] px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl lg:hidden"
          exit={reducedMotion ? { opacity: 0 } : { y: "100%", opacity: 0 }}
          initial={reducedMotion ? false : { y: "100%", opacity: 0 }}
          transition={reducedMotion ? { duration: 0 } : { duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mx-auto flex w-[min(640px,100%)] items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-[hsl(var(--muted))]">
                {selectedCount === 1 ? "1 servicio" : `${selectedCount} servicios`}
                {time ? ` · ${formatHora(time)}` : ""}
              </p>
              <p className="text-lg font-black leading-tight">
                {durationMinutes ? formatDuration(durationMinutes) : ""}
              </p>
            </div>
            <Button asChild size="md">
              <a href="#reservar">
                {time ? "Completar datos" : "Elegir hora"}
                <ArrowRight aria-hidden="true" className="size-4" />
              </a>
            </Button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
