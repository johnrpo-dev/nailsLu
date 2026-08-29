"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CalendarCheck, ShieldCheck } from "lucide-react";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import type { PublicBookingResult } from "@spa/shared";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useToast } from "@/components/ui/toast";
import { ServiceCatalog } from "@/features/service-catalog/components/service-catalog";
import { useServices } from "@/features/service-catalog/hooks/use-services";
import { ApiError } from "@/shared/api/client";
import { generarClaveIdempotencia } from "@/shared/lib/clave-idempotencia";
import { todayIsoDate } from "@/shared/lib/date";
import { formatDuration } from "@/shared/lib/format";
import { createPublicBooking } from "../services/booking-api";
import { BookingConfirmationDialog } from "./booking-confirmation-dialog";
import { ContactExpressForm, type ContactFormValues } from "./contact-express-form";
import { DateTimePicker } from "./date-time-picker";
import { MobileSummaryBar } from "./mobile-summary-bar";

export function BookingExperience({ brand }: { brand?: ReactNode }) {
  const { services, status, errorMessage, retry } = useServices();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [date, setDate] = useState(todayIsoDate);
  const [time, setTime] = useState("");
  const [confirmed, setConfirmed] = useState<PublicBookingResult | null>(null);
  const { showToast } = useToast();
  const reducedMotion = useReducedMotion();

  const selectedServices = useMemo(
    () => services.filter((service) => selectedIds.includes(service.id)),
    [services, selectedIds],
  );
  const durationMinutes = selectedServices.reduce((sum, service) => sum + service.durationMinutes, 0);

  const missingRequirements = useMemo(() => {
    const missing: string[] = [];
    if (!selectedServices.length) missing.push("elegir un servicio");
    if (!time) missing.push("elegir un horario");
    return missing;
  }, [selectedServices.length, time]);

  const toggleService = useCallback((id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }, []);

  const submitContact = useCallback(
    async (input: ContactFormValues) => {
      try {
        const booking = await createPublicBooking({
          ...input,
          serviceIds: selectedIds,
          date,
          startTime: time,
          idempotencyKey: generarClaveIdempotencia(),
          // El formulario no deja enviar sin marcarla; el API la vuelve a
          // validar porque la ley exige consentimiento expreso.
          dataConsent: true,
          website: "",
        });

        setConfirmed(booking);
        setSelectedIds([]);
        setTime("");
      } catch (error) {
        // Un 409 significa que alguien tomo la franja mientras se llenaba el
        // formulario: se limpia la hora para forzar una eleccion vigente.
        if (error instanceof ApiError && error.isSlotTaken) {
          setTime("");
          showToast({
            title: "Ese horario se acaba de ocupar",
            description: "Recargamos la agenda para que elijas otra franja.",
            variant: "error",
          });
        } else {
          showToast({
            title: "No pudimos enviar tu reserva",
            description:
              error instanceof ApiError ? error.message : "Intenta de nuevo en un momento.",
            variant: "error",
          });
        }
        throw error;
      }
    },
    [date, selectedIds, showToast, time],
  );

  return (
    <>
      <a className="skip-link focus-ring rounded-full bg-[hsl(var(--primary))] px-4 py-2 text-sm font-bold text-[hsl(var(--primary-foreground))]" href="#reservar">
        Ir al formulario de reserva
      </a>

      <main className="mx-auto min-h-screen w-[min(1440px,100%)] px-4 pb-28 pt-4 sm:px-6 lg:px-8 lg:pb-8">
        <header className="flex items-center justify-between gap-4 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.62)] px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            {brand}
            <p className="text-xs font-semibold text-[hsl(var(--muted))]">Reservas sin registro</p>
          </div>
          <ThemeToggle />
        </header>

        <section className="grid gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-start">
          <div>
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              initial={reducedMotion ? false : { opacity: 0, y: 18 }}
              transition={reducedMotion ? { duration: 0 } : { duration: 0.5 }}
            >
              <Badge>
                <ShieldCheck aria-hidden="true" className="size-3.5" /> Disponibilidad en tiempo real
              </Badge>
              <h1 className="mt-5 max-w-4xl text-4xl font-black leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl lg:leading-[0.95]">
                Agenda tus uñas con una experiencia suave y precisa.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-[hsl(var(--muted))] sm:text-lg">
                Elige servicios, revisa horarios disponibles y deja tu contacto. Todo el flujo ocurre en una sola
                pantalla, sin registro obligatorio y con confirmación clara.
              </p>
            </motion.div>

            <div className="mt-8">
              <ServiceCatalog
                errorMessage={errorMessage}
                onRetry={retry}
                onToggle={toggleService}
                selectedIds={selectedIds}
                services={services}
                status={status}
              />
            </div>
          </div>

          <aside className="glass-panel grid gap-4 rounded-[2.25rem] p-4 lg:sticky lg:top-4" id="reservar">
            <div className="rounded-[2rem] bg-[hsl(var(--surface)/0.68)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase text-[hsl(var(--muted))]">Resumen</p>
                  <p className="mt-1 text-2xl font-black">
                    {durationMinutes ? formatDuration(durationMinutes) : "Sin servicios"}
                  </p>
                </div>
                <Badge>
                  <CalendarCheck aria-hidden="true" className="size-3.5" />
                  {selectedServices.length === 1 ? "1 servicio" : `${selectedServices.length} servicios`}
                </Badge>
              </div>
              <p aria-live="polite" className="mt-3 text-sm leading-6 text-[hsl(var(--muted))]">
                {selectedServices.length
                  ? selectedServices.map((service) => service.name).join(", ")
                  : "Selecciona al menos un servicio para ver horarios."}
              </p>
            </div>

            <DateTimePicker
              date={date}
              durationMinutes={durationMinutes}
              onDateChange={setDate}
              onTimeChange={setTime}
              time={time}
            />

            <ContactExpressForm missingRequirements={missingRequirements} onSubmit={submitContact} />
          </aside>
        </section>
      </main>

      <MobileSummaryBar
        durationMinutes={durationMinutes}
        selectedCount={selectedServices.length}
        time={time}
      />

      <BookingConfirmationDialog booking={confirmed} onOpenChange={(open) => !open && setConfirmed(null)} />
    </>
  );
}
