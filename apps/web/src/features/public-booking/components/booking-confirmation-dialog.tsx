"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CalendarCheck, Check, Clock3, Copy, ExternalLink, MessageCircle, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { PublicBookingResult } from "@spa/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatLongDate } from "@/shared/lib/date";
import { formatDuration } from "@/shared/lib/format";
import { construirAvisoReserva, hayWhatsappConfigurado } from "@/shared/lib/whatsapp";

export function BookingConfirmationDialog({
  booking,
  onOpenChange,
}: {
  booking: PublicBookingResult | null;
  onOpenChange: (open: boolean) => void;
}) {
  const reducedMotion = useReducedMotion();
  const [copied, setCopied] = useState(false);
  /** Cierto cuando ya pulso el boton de WhatsApp: cambia el dialogo de estado. */
  const [avisado, setAvisado] = useState(false);
  const open = Boolean(booking);

  /*
   * Reiniciar al llegar una reserva nueva. Se compara durante el render en vez
   * de en un efecto: asi el dialogo nunca llega a pintarse un fotograma con el
   * estado de la reserva anterior.
   */
  const token = booking?.publicToken ?? null;
  const [tokenVisto, setTokenVisto] = useState(token);
  if (token !== tokenVisto) {
    setTokenVisto(token);
    setAvisado(false);
    setCopied(false);
  }

  /*
   * Ruta relativa para el enlace y absoluta para copiar: pegar "/reserva/..."
   * en un chat no lleva a ninguna parte. `window` no existe al renderizar en
   * el servidor, pero este bloque solo corre con el dialogo abierto, que es
   * siempre en el navegador.
   */
  const rutaReserva = booking ? `/reserva/${booking.publicToken}` : "";

  async function copiarEnlace() {
    if (!booking) return;
    const absoluto =
      typeof window === "undefined" ? rutaReserva : `${window.location.origin}${rutaReserva}`;
    try {
      await navigator.clipboard.writeText(absoluto);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sin permiso de portapapeles queda el boton "Abrir mi cita", que no
      // depende de copiar nada.
    }
  }

  return (
    <Dialog.Root onOpenChange={onOpenChange} open={open}>
      <AnimatePresence>
        {open && booking ? (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                animate={{ opacity: 1 }}
                className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[min(520px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[2rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-2xl"
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: 12 }}
                initial={reducedMotion ? false : { opacity: 0, scale: 0.96, y: 20 }}
                transition={reducedMotion ? { duration: 0 } : { duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="flex items-start justify-between gap-4">
                  {/*
                    La `key` hace que React monte una marca nueva al pasar a
                    avisado, asi el trazo se vuelve a dibujar y el cambio de
                    estado se nota. Sin ella el SVG ya animado se quedaria
                    quieto y el paso pasaria desapercibido.
                  */}
                  <SuccessMark
                    celebrar={avisado}
                    key={avisado ? "avisado" : "registrada"}
                    reducedMotion={Boolean(reducedMotion)}
                  />
                  <Dialog.Close asChild>
                    <Button aria-label="Cerrar confirmación" size="icon" type="button" variant="ghost">
                      <X aria-hidden="true" className="size-4" />
                    </Button>
                  </Dialog.Close>
                </div>

                <Dialog.Title className="mt-5 text-2xl font-black tracking-tight">
                  {avisado ? "¡Listo! Ya nos avisaste" : "Tu reserva quedó registrada"}
                </Dialog.Title>
                <Dialog.Description className="mt-2 text-sm leading-7 text-[hsl(var(--muted))]">
                  {avisado ? (
                    <>
                      Te confirmamos por WhatsApp al {formatPhoneDisplay(booking.client.phone)} apenas veamos tu
                      mensaje. Si no alcanzaste a enviarlo, puedes abrirlo de nuevo aquí abajo.
                    </>
                  ) : (
                    <>
                      Te escribimos al {formatPhoneDisplay(booking.client.phone)} para confirmar el turno. Guarda el
                      enlace de abajo por si necesitas consultarla o cancelarla.
                    </>
                  )}
                </Dialog.Description>

                <div className="mt-6 rounded-[1.5rem] bg-[hsl(var(--surface))] p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>
                      <CalendarCheck aria-hidden="true" className="size-3.5" />
                      {formatLongDate(booking.scheduledDate.slice(0, 10))}
                    </Badge>
                    <Badge>
                      <Clock3 aria-hidden="true" className="size-3.5" />
                      {booking.startTime} a {booking.endTime}
                    </Badge>
                  </div>

                  <ul className="mt-4 grid gap-2">
                    {booking.services.map((service) => (
                      <li className="flex items-baseline justify-between gap-4 text-sm" key={service.serviceId}>
                        <span className="font-semibold">{service.serviceNameSnapshot}</span>
                        <span className="text-[hsl(var(--muted))]">
                          {formatDuration(service.durationSnapshotMinutes)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-[hsl(var(--border))] pt-4">
                    <span className="text-sm font-bold uppercase text-[hsl(var(--muted))]">Duración total</span>
                    <span className="text-xl font-black">{formatDuration(booking.totalDurationMinutes)}</span>
                  </div>
                </div>

                {/*
                  Antes aqui se mostraba el token crudo y se pedia guardarlo,
                  pero no habia donde usarlo. Ahora es un enlace a /reserva, que
                  es lo que se puede guardar de verdad: nadie transcribe 48
                  caracteres a mano.
                */}
                <div className="mt-4 grid min-w-0 gap-3 rounded-[1.5rem] border border-dashed border-[hsl(var(--border))] p-4">
                  <div className="grid gap-1">
                    <p className="text-xs font-bold uppercase text-[hsl(var(--muted))]">Tu cita</p>
                    <p className="text-sm leading-6 text-[hsl(var(--muted))]">
                      Guarda este enlace para ver el estado de tu cita o cancelarla.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button asChild size="sm" variant="secondary">
                      <Link href={rutaReserva} target="_blank">
                        <ExternalLink aria-hidden="true" className="size-4" /> Abrir mi cita
                      </Link>
                    </Button>
                    <Button onClick={copiarEnlace} size="sm" type="button" variant="secondary">
                      {copied ? <Check aria-hidden="true" className="size-4" /> : <Copy aria-hidden="true" className="size-4" />}
                      {copied ? "Copiado" : "Copiar enlace"}
                    </Button>
                  </div>
                </div>

                {/*
                  El aviso por WhatsApp es la unica accion del dialogo: sin un
                  boton de "Listo" al lado, confirmar la cita y avisar son el
                  mismo gesto. Cerrar sigue siendo posible con la X de arriba,
                  porque un dialogo del que no se puede salir es una trampa
                  para quien navega con teclado o lector de pantalla.
                */}
                {hayWhatsappConfigurado() ? (
                  <div className="mt-6 grid gap-2">
                    <Button
                      asChild
                      className="w-full"
                      size="lg"
                      variant={avisado ? "secondary" : "primary"}
                    >
                      <a
                        href={construirAvisoReserva({
                          clientName: booking.client.fullName,
                          phone: formatPhoneDisplay(booking.client.phone),
                          fechaLarga: formatLongDate(booking.scheduledDate.slice(0, 10)),
                          startTime: booking.startTime,
                          endTime: booking.endTime,
                          servicios: booking.services.map((s) => s.serviceNameSnapshot),
                          publicToken: booking.publicToken,
                        })}
                        /*
                          No sabemos si llego a enviar el mensaje, solo que
                          abrio WhatsApp. El dialogo cambia de estado con eso,
                          y por eso el texto siguiente ofrece reabrirlo en vez
                          de dar el envio por hecho.
                        */
                        onClick={() => setAvisado(true)}
                        rel="noreferrer"
                        target="_blank"
                      >
                        <MessageCircle aria-hidden="true" className="size-4" />
                        {avisado ? "Abrir WhatsApp otra vez" : "Avisarnos por WhatsApp"}
                      </a>
                    </Button>

                    {avisado ? (
                      <Dialog.Close asChild>
                        <Button className="w-full" size="lg" type="button">
                          Cerrar
                        </Button>
                      </Dialog.Close>
                    ) : (
                      <p className="text-center text-xs leading-5 text-[hsl(var(--muted))]">
                        El mensaje ya va escrito: solo tienes que enviarlo para que confirmemos tu turno.
                      </p>
                    )}
                  </div>
                ) : (
                  /*
                    Sin numero no hay enlace que ofrecer. `next.config.mjs`
                    impide compilar para produccion en ese estado, asi que esto
                    solo se ve en desarrollo: mejor decir que falta configurar
                    que ofrecer un "Listo" que aparente normalidad.
                  */
                  <p className="mt-6 rounded-[1.5rem] border border-[hsl(var(--danger)/0.32)] bg-[hsl(var(--danger)/0.06)] p-4 text-sm leading-6">
                    Falta configurar el número de WhatsApp del spa
                    (<code className="font-mono text-xs">NEXT_PUBLIC_WHATSAPP_NUMBER</code>). Tu reserva
                    quedó guardada, pero no podemos avisar desde aquí.
                  </p>
                )}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}

/**
 * Circulo que se dibuja y check que se traza: el remate de la confirmacion.
 *
 * Con `celebrar` anade un anillo que se expande y se desvanece una sola vez,
 * para marcar el paso a "ya avisaste". Es un gesto corto a proposito: la
 * clienta viene de cambiar de aplicacion y lo que necesita es una senal clara,
 * no una animacion que la retenga.
 */
function SuccessMark({ celebrar = false, reducedMotion }: { celebrar?: boolean; reducedMotion: boolean }) {
  return (
    <span className="relative grid size-14 place-items-center rounded-full bg-[hsl(var(--accent)/0.14)]">
      {celebrar && !reducedMotion ? (
        <motion.span
          animate={{ scale: 1.9, opacity: 0 }}
          className="absolute inset-0 rounded-full border-2 border-[hsl(var(--accent))]"
          initial={{ scale: 1, opacity: 0.55 }}
          transition={{ duration: 0.85, ease: "easeOut" }}
        />
      ) : null}
      <svg aria-hidden="true" className="size-8" fill="none" viewBox="0 0 36 36">
        <motion.circle
          animate={{ pathLength: 1 }}
          cx="18"
          cy="18"
          initial={reducedMotion ? false : { pathLength: 0 }}
          r="15"
          stroke="hsl(var(--accent))"
          strokeLinecap="round"
          strokeWidth="2.5"
          transition={reducedMotion ? { duration: 0 } : { duration: 0.5, ease: "easeOut" }}
        />
        <motion.path
          animate={{ pathLength: 1 }}
          d="M11 18.5l4.6 4.5L25 13.5"
          initial={reducedMotion ? false : { pathLength: 0 }}
          stroke="hsl(var(--accent))"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.8"
          transition={reducedMotion ? { duration: 0 } : { delay: 0.28, duration: 0.32, ease: "easeOut" }}
        />
      </svg>
    </span>
  );
}

function formatPhoneDisplay(phone: string) {
  return phone.replace(/(\d{3})(\d{3})(\d{0,4})/, (_match, a, b, c) => [a, b, c].filter(Boolean).join(" "));
}
