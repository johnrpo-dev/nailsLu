"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Clock, Sparkles, X } from "lucide-react";
import type { ServiceSummary } from "@spa/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/shared/lib/format";
import { GaleriaServicio } from "./galeria-servicio";

/**
 * Detalle de un servicio: las fotos del trabajo y la descripcion completa.
 *
 * Existe porque la tarjeta del catalogo recorta la descripcion a dos lineas y
 * la mayoria de servicios tienen cinco fotos que la clienta quiere mirar antes
 * de decidir. Y lleva "Elegir" dentro: sin eso habia que cerrar y volver a
 * buscar la tarjeta, que es pedirle dos pasos para algo que ya decidio.
 */
export function ServiceDetailsDialog({
  open,
  service,
  selected,
  onToggle,
  onOpenChange,
}: {
  open: boolean;
  service: ServiceSummary | null;
  selected: boolean;
  onToggle: (id: string) => void;
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
            {/*
              Columna de tres partes con el alto acotado: encabezado y pie
              fijos, y el scroll solo en el medio.

              Sin `max-h` la card media el contenido entero —la foto sola se
              lleva la mitad— y al estar centrada el sobrante se partia mitad
              arriba y mitad abajo. En un movil eso dejaba la X fuera de la
              pantalla y, como la card cubria todo el alto, tampoco quedaba
              overlay que tocar para cerrar: la unica salida era el boton
              "atras" del navegador.

              El scroll va en el cuerpo y no en la card, a diferencia de los
              otros dos dialogos, porque aqui hay cinco fotos que recorrer y
              las dos salidas tienen que seguir alcanzables mientras se miran.

              El ancho y el relleno estan medidos contra la tarjeta del
              catalogo: con 560px y `p-6` las fotos salian mas pequenas aqui
              que alla, que es lo contrario de lo que un detalle debe hacer.
            */}
            <Dialog.Content asChild>
              <motion.div
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[min(640px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[2rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-2xl"
                exit={{ opacity: 0, scale: 0.98, y: 12 }}
                initial={{ opacity: 0, scale: 0.96, y: 20 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                <div className="flex shrink-0 items-start justify-between gap-4 p-4 pb-0">
                  <div>
                    <Badge>
                      <Sparkles aria-hidden="true" className="size-3.5" /> Servicio premium
                    </Badge>
                    <Dialog.Title className="mt-3 text-2xl font-black tracking-tight">{service.name}</Dialog.Title>
                  </div>
                  <Dialog.Close asChild>
                    <Button aria-label="Cerrar detalles" size="icon" type="button" variant="secondary">
                      <X aria-hidden="true" className="size-5" />
                    </Button>
                  </Dialog.Close>
                </div>

                {/* `overscroll-contain`: al llegar al final no arrastra la pagina de detras. */}
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4">
                  {/*
                    En el detalle las fotos se ven completas, sin recortar: el
                    encuadre de la tarjeta existe para que la portada llene su
                    marco, pero aqui la clienta quiere ver el diseno entero.
                  */}
                  <GaleriaServicio service={service} />

                  <Dialog.Description className="mt-4 text-sm leading-7 text-[hsl(var(--muted))]">
                    {service.description ??
                      "Servicio realizado con preparación cuidadosa, acabado limpio y seguimiento de disponibilidad en tiempo real."}
                  </Dialog.Description>
                  <div className="mt-4 rounded-2xl bg-[hsl(var(--surface))] p-4">
                    <p className="text-xs font-semibold uppercase text-[hsl(var(--muted))]">Duración</p>
                    <p className="mt-1 flex items-center gap-2 text-xl font-black">
                      <Clock aria-hidden="true" className="size-4" /> {formatDuration(service.durationMinutes)}
                    </p>
                  </div>
                </div>

                {/*
                  Las dos salidas al pie y en una sola fila. En el movil el
                  pulgar llega antes aqui que a una esquina superior, y el
                  borde avisa de que arriba queda contenido por desplazar.
                */}
                <div className="shrink-0 border-t border-[hsl(var(--border))] p-4">
                  <div className="flex gap-2">
                    <Dialog.Close asChild>
                      <Button className="flex-1" type="button" variant="secondary">
                        Cerrar
                      </Button>
                    </Dialog.Close>
                    <Button
                      aria-pressed={selected}
                      className="flex-[2]"
                      onClick={() => onToggle(service.id)}
                      type="button"
                    >
                      {selected ? <Check aria-hidden="true" className="size-4" /> : null}
                      {selected ? "Elegido" : "Elegir este servicio"}
                    </Button>
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
