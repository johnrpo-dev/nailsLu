"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, Sparkles, X } from "lucide-react";
import type { ServiceSummary } from "@spa/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/shared/lib/format";
import { estiloDeEncuadre, urlDeFoto } from "@/shared/lib/service-image";

export function ServiceDetailsDialog({
  open,
  service,
  onOpenChange,
}: {
  open: boolean;
  service: ServiceSummary | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog.Root onOpenChange={onOpenChange} open={open}>
      <AnimatePresence>
        {open && service ? (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                animate={{ opacity: 1 }}
                className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm"
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="fixed left-1/2 top-1/2 z-50 w-[min(560px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 rounded-[2rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-2xl"
                exit={{ opacity: 0, scale: 0.98, y: 12 }}
                initial={{ opacity: 0, scale: 0.96, y: 20 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Badge>
                      <Sparkles className="size-3.5" /> Servicio premium
                    </Badge>
                    <Dialog.Title className="mt-4 text-2xl font-black tracking-tight">{service.name}</Dialog.Title>
                  </div>
                  <Dialog.Close asChild>
                    <Button aria-label="Cerrar detalles" size="icon" type="button" variant="ghost">
                      <X className="size-4" />
                    </Button>
                  </Dialog.Close>
                </div>
                {urlDeFoto(service.imageUrl) ? (
                  <div className="mt-5 aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-[hsl(var(--surface))]">
                    <img
                      alt={service.name}
                      className="size-full object-cover"
                      src={urlDeFoto(service.imageUrl) as string}
                      style={estiloDeEncuadre(service)}
                    />
                  </div>
                ) : null}

                <Dialog.Description className="mt-4 text-sm leading-7 text-[hsl(var(--muted))]">
                  {service.description ??
                    "Servicio realizado con preparación cuidadosa, acabado limpio y seguimiento de disponibilidad en tiempo real."}
                </Dialog.Description>
                <div className="mt-6 grid gap-3">
                  <div className="rounded-2xl bg-[hsl(var(--surface))] p-4">
                    <p className="text-xs font-semibold uppercase text-[hsl(var(--muted))]">Duración</p>
                    <p className="mt-1 flex items-center gap-2 text-xl font-black">
                      <Clock aria-hidden="true" className="size-4" /> {formatDuration(service.durationMinutes)}
                    </p>
                  </div>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}
