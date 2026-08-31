"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertCircle, Check, Clock, Gem, Info, RotateCw, Sparkles } from "lucide-react";
import { useState } from "react";
import type { ServiceSummary } from "@spa/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/shared/lib/cn";
import { fotosDeServicio } from "@/shared/lib/service-image";
import { formatDuration } from "@/shared/lib/format";
import type { ServicesStatus } from "../hooks/use-services";
import { CarruselTarjeta } from "./carrusel-tarjeta";
import { ServiceDetailsDialog } from "./service-details-dialog";

export function ServiceCatalog({
  services,
  status,
  errorMessage,
  selectedIds,
  onToggle,
  onRetry,
}: {
  services: ServiceSummary[];
  status: ServicesStatus;
  errorMessage: string;
  selectedIds: string[];
  onToggle: (id: string) => void;
  onRetry: () => void;
}) {
  const [details, setDetails] = useState<ServiceSummary | null>(null);
  const reducedMotion = useReducedMotion();

  if (status === "loading") {
    return (
      <div aria-busy="true" aria-label="Cargando servicios" className="grid gap-4 sm:grid-cols-2">
        {[1, 2, 3, 4].map((item) => (
          <Skeleton className="h-52 rounded-[1.75rem]" key={item} />
        ))}
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="grid justify-items-start gap-3 rounded-[1.75rem] border border-[hsl(var(--danger)/0.32)] bg-[hsl(var(--danger)/0.06)] p-6">
        <p className="flex items-start gap-2 text-base font-bold">
          <AlertCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[hsl(var(--danger))]" />
          {errorMessage}
        </p>
        <p className="max-w-prose text-sm leading-7 text-[hsl(var(--muted))]">
          El catálogo y los precios vienen del servidor. Reinténtalo en un momento y, si sigue igual, escríbenos por
          WhatsApp y agendamos manualmente.
        </p>
        <Button onClick={onRetry} type="button" variant="secondary">
          <RotateCw aria-hidden="true" className="size-4" /> Reintentar
        </Button>
      </div>
    );
  }

  if (!services.length) {
    return (
      <div className="grid justify-items-start gap-3 rounded-[1.75rem] border border-dashed border-[hsl(var(--border))] p-6">
        <span className="grid size-12 place-items-center rounded-full bg-[hsl(var(--surface))]">
          <Sparkles aria-hidden="true" className="size-5 text-[hsl(var(--muted))]" />
        </span>
        <p className="text-base font-bold">Todavía no hay servicios publicados</p>
        <p className="max-w-prose text-sm leading-7 text-[hsl(var(--muted))]">
          Estamos preparando el catálogo. Vuelve pronto y encontrarás aquí las opciones con precio y duración.
        </p>
      </div>
    );
  }

  return (
    <>
      <section aria-label="Catálogo de servicios" className="grid gap-4 sm:grid-cols-2">
        <AnimatePresence initial={false}>
          {services.map((service, index) => {
            const selected = selectedIds.includes(service.id);
            return (
              <motion.article
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "group relative overflow-hidden rounded-[1.75rem] border p-4 transition duration-300",
                  selected
                    ? "border-[hsl(var(--primary)/0.54)] bg-[hsl(var(--primary)/0.08)]"
                    : "border-[hsl(var(--border))] bg-[hsl(var(--card)/0.72)] hover:border-[hsl(var(--primary)/0.35)]",
                )}
                exit={reducedMotion ? undefined : { opacity: 0, y: 16 }}
                initial={reducedMotion ? false : { opacity: 0, y: 18 }}
                key={service.id}
                layout={!reducedMotion}
                transition={
                  reducedMotion ? { duration: 0 } : { delay: Math.min(index * 0.05, 0.3), duration: 0.34, ease: "easeOut" }
                }
              >
                {/*
                  El carrusel va en la tarjeta y no solo en el detalle: si las
                  fotos solo se vieran al abrir, la clienta no sabria que hay
                  mas de una.
                */}
                <CarruselTarjeta onAbrir={() => setDetails(service)} service={service} />

                {!fotosDeServicio(service).length ? (
                  <div
                    aria-hidden="true"
                    className="absolute right-4 top-4 text-[hsl(var(--primary)/0.16)] transition duration-300 group-hover:scale-110 group-hover:text-[hsl(var(--primary)/0.24)]"
                  >
                    <Gem className="size-12" />
                  </div>
                ) : null}

                <div className="relative">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>
                      <Sparkles aria-hidden="true" className="size-3.5" /> Disponible
                    </Badge>
                    <Badge>
                      <Clock aria-hidden="true" className="size-3.5" /> {formatDuration(service.durationMinutes)}
                    </Badge>
                  </div>
                  <h3 className="mt-5 max-w-[14rem] text-xl font-black tracking-tight">{service.name}</h3>
                  <p className="mt-2 line-clamp-2 min-h-11 text-sm leading-6 text-[hsl(var(--muted))]">
                    {service.description}
                  </p>
                  <div className="mt-5 flex items-center justify-end gap-3">
                    <div className="flex gap-2">
                      <Button
                        aria-label={`Ver detalles de ${service.name}`}
                        onClick={() => setDetails(service)}
                        size="icon"
                        type="button"
                        variant="secondary"
                      >
                        <Info aria-hidden="true" className="size-4" />
                      </Button>
                      <Button
                        aria-label={`${selected ? "Quitar" : "Elegir"} ${service.name}`}
                        aria-pressed={selected}
                        onClick={() => onToggle(service.id)}
                        size="sm"
                        type="button"
                        variant={selected ? "primary" : "secondary"}
                      >
                        {selected ? <Check aria-hidden="true" className="size-4" /> : null}
                        {selected ? "Elegido" : "Elegir"}
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </AnimatePresence>
      </section>
      <ServiceDetailsDialog
        onOpenChange={(open) => !open && setDetails(null)}
        open={Boolean(details)}
        service={details}
      />
    </>
  );
}
