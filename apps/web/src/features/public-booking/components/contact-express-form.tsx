"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { AlertCircle, House, Info, MapPin, Phone, Send, Store, UserRound } from "lucide-react";
import { useMemo, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import type { ServiceLocation } from "@spa/shared";
import { cn } from "@/shared/lib/cn";

type FieldName = "clientName" | "phone" | "serviceLocation" | "address";

export type ContactFormValues = {
  clientName: string;
  phone: string;
  notes: string;
  serviceLocation: ServiceLocation;
  /** Solo se envia a domicilio. */
  address?: string;
};

/**
 * Estado interno del formulario.
 *
 * `serviceLocation` empieza vacio a proposito, sin marcar el spa por defecto:
 * si viniera preseleccionado, quien quiere domicilio y no se fija acabaria con
 * una cita en el sitio equivocado. Un toque de mas vale menos que un viaje en
 * balde.
 */
type EstadoFormulario = {
  clientName: string;
  phone: string;
  notes: string;
  serviceLocation: "" | ServiceLocation;
  address: string;
};

const VACIO: EstadoFormulario = {
  clientName: "",
  phone: "",
  notes: "",
  serviceLocation: "",
  address: "",
};

export function ContactExpressForm({
  missingRequirements,
  onSubmit,
}: {
  /** Pasos previos sin completar (servicio, horario). Bloquean el envio. */
  missingRequirements: string[];
  onSubmit: (input: ContactFormValues) => Promise<void>;
}) {
  const [values, setValues] = useState<EstadoFormulario>(VACIO);
  const [consent, setConsent] = useState(false);
  const [consentTouched, setConsentTouched] = useState(false);
  const [touched, setTouched] = useState<Record<FieldName, boolean>>({
    clientName: false,
    phone: false,
    serviceLocation: false,
    address: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  const digits = values.phone.replace(/\D/g, "");
  const blocked = missingRequirements.length > 0;

  const errors = useMemo(() => {
    const next: Partial<Record<FieldName, string>> = {};
    const name = values.clientName.trim();

    if (!name) next.clientName = "Escribe tu nombre.";
    else if (name.length < 2) next.clientName = "El nombre debe tener al menos 2 letras.";
    else if (name.length > 80) next.clientName = "El nombre es demasiado largo.";

    if (!digits) next.phone = "Escribe tu número de contacto.";
    else if (digits.length < 7) next.phone = "El número está incompleto.";
    else if (digits.length > 10) next.phone = "Revisa el número, tiene dígitos de más.";

    if (!values.serviceLocation) next.serviceLocation = "Elige dónde quieres el servicio.";

    if (values.serviceLocation === "DOMICILIO") {
      const direccion = values.address.trim();
      if (!direccion) next.address = "Escribe la dirección donde vamos a atenderte.";
      else if (direccion.length < 10) next.address = "La dirección está incompleta.";
      else if (direccion.length > 200) next.address = "La dirección es demasiado larga.";
    }

    return next;
  }, [values.clientName, digits, values.serviceLocation, values.address]);

  const valid = Object.keys(errors).length === 0 && consent;

  function setField(field: keyof EstadoFormulario, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched({ clientName: true, phone: true, serviceLocation: true, address: true });
    setConsentTouched(true);

    // Se revelan los errores y se lleva el foco al primer campo con problema
    // en vez de dejar un boton inerte sin explicacion.
    if (!valid) {
      if (errors.clientName) nameRef.current?.focus();
      else if (errors.phone) phoneRef.current?.focus();
      else if (errors.serviceLocation) locationRef.current?.focus();
      else if (errors.address) addressRef.current?.focus();
      else consentRef.current?.focus();
      return;
    }
    if (blocked) return;

    setSubmitting(true);
    try {
      const enDomicilio = values.serviceLocation === "DOMICILIO";
      await onSubmit({
        clientName: values.clientName.trim(),
        phone: digits,
        notes: values.notes.trim(),
        serviceLocation: values.serviceLocation as ServiceLocation,
        // Fuera del domicilio no se manda direccion: el API la rechaza y, sobre
        // todo, no hay motivo para enviar donde vive quien viene al local.
        ...(enDomicilio ? { address: values.address.trim() } : {}),
      });
      setValues(VACIO);
      setTouched({ clientName: false, phone: false, serviceLocation: false, address: false });
      setConsent(false);
      setConsentTouched(false);
    } catch {
      // El aviso lo emite el contenedor via toast; aqui solo se libera el boton
      // para que la clienta pueda reintentar sin recargar.
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      className="grid gap-4 rounded-[2rem] border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.72)] p-4"
      noValidate
      onSubmit={submit}
    >
      <div>
        <p className="text-xs font-bold uppercase text-[hsl(var(--muted))]">Contacto express</p>
        <h2 className="mt-1 text-xl font-black tracking-tight">Confirma tus datos</h2>
      </div>

      {/*
        La modalidad va primero: cambia a que se compromete la clienta y, si es
        a domicilio, hace aparecer un campo mas. Preguntarlo al final obligaria
        a rehacer el formulario hacia arriba.
      */}
      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm font-bold text-[hsl(var(--muted))]">
          ¿Dónde quieres el servicio?
        </legend>
        <div
          aria-describedby={touched.serviceLocation && errors.serviceLocation ? "location-error" : undefined}
          aria-invalid={Boolean(touched.serviceLocation && errors.serviceLocation)}
          className="grid grid-cols-2 gap-2"
          ref={locationRef}
          role="radiogroup"
          tabIndex={-1}
        >
          {[
            { valor: "SPA" as const, etiqueta: "En el spa", Icono: Store },
            { valor: "DOMICILIO" as const, etiqueta: "A domicilio", Icono: House },
          ].map(({ valor, etiqueta, Icono }) => {
            const elegido = values.serviceLocation === valor;
            return (
              <button
                aria-checked={elegido}
                className={cn(
                  "focus-ring flex min-h-12 items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-sm font-black transition",
                  elegido
                    ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.12)]"
                    : "border-[hsl(var(--border))] bg-[hsl(var(--surface)/0.58)] hover:border-[hsl(var(--primary)/0.45)]",
                )}
                key={valor}
                onClick={() => {
                  setField("serviceLocation", valor);
                  setTouched((current) => ({ ...current, serviceLocation: true }));
                }}
                role="radio"
                type="button"
              >
                <Icono aria-hidden="true" className="size-4 shrink-0" />
                {etiqueta}
              </button>
            );
          })}
        </div>
        {touched.serviceLocation && errors.serviceLocation ? (
          <p className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--danger))]" id="location-error">
            <AlertCircle aria-hidden="true" className="size-4 shrink-0" />
            {errors.serviceLocation}
          </p>
        ) : null}
      </fieldset>

      {values.serviceLocation === "DOMICILIO" ? (
        <Field
          error={touched.address ? errors.address : undefined}
          hint="Barrio, calle y número. Lo usamos solo para llegar a tu cita."
          icon={MapPin}
          label="Dirección"
          name="address"
        >
          {({ id, describedBy, invalid }) => (
            <input
              aria-describedby={describedBy}
              aria-invalid={invalid}
              autoComplete="street-address"
              className={inputClassName(invalid)}
              id={id}
              onBlur={() => setTouched((current) => ({ ...current, address: true }))}
              onChange={(event) => setField("address", event.target.value)}
              placeholder="Cra 45 #12-30, apto 301, barrio Laureles"
              ref={addressRef}
              value={values.address}
            />
          )}
        </Field>
      ) : null}

      <Field
        error={touched.clientName ? errors.clientName : undefined}
        icon={UserRound}
        label="Nombre"
        name="clientName"
      >
        {({ id, describedBy, invalid }) => (
          <input
            aria-describedby={describedBy}
            aria-invalid={invalid}
            autoComplete="name"
            className={inputClassName(invalid)}
            id={id}
            onBlur={() => setTouched((current) => ({ ...current, clientName: true }))}
            onChange={(event) => setField("clientName", event.target.value)}
            placeholder="Tu nombre"
            ref={nameRef}
            value={values.clientName}
          />
        )}
      </Field>

      <Field
        error={touched.phone ? errors.phone : undefined}
        hint="Te escribimos por WhatsApp para confirmar."
        icon={Phone}
        label="WhatsApp o teléfono"
        name="phone"
      >
        {({ id, describedBy, invalid }) => (
          <input
            aria-describedby={describedBy}
            aria-invalid={invalid}
            autoComplete="tel"
            className={inputClassName(invalid)}
            id={id}
            inputMode="tel"
            onBlur={() => setTouched((current) => ({ ...current, phone: true }))}
            onChange={(event) => setField("phone", formatPhone(event.target.value))}
            placeholder="300 123 4567"
            ref={phoneRef}
            value={values.phone}
          />
        )}
      </Field>

      <label className="grid gap-2 text-sm font-bold text-[hsl(var(--muted))]" htmlFor="notes">
        Nota opcional
        <textarea
          className="focus-ring min-h-24 w-full resize-none rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface)/0.58)] px-4 py-3 text-[hsl(var(--foreground))]"
          id="notes"
          maxLength={500}
          onChange={(event) => setField("notes", event.target.value)}
          placeholder="Color, diseño o preferencia"
          value={values.notes}
        />
      </label>

      <div className="grid gap-2">
        <label className="flex items-start gap-3 text-sm leading-6" htmlFor="data-consent">
          <input
            aria-describedby={consentTouched && !consent ? "data-consent-error" : undefined}
            aria-invalid={consentTouched && !consent}
            checked={consent}
            className="mt-0.5 size-5 shrink-0 accent-[hsl(var(--primary))]"
            id="data-consent"
            onChange={(event) => {
              setConsent(event.target.checked);
              setConsentTouched(true);
            }}
            ref={consentRef}
            type="checkbox"
          />
          <span className="text-[hsl(var(--muted))]">
            Autorizo el tratamiento de mis datos para agendar y confirmar mi cita, según la{" "}
            <Link
              className="focus-ring rounded font-bold text-[hsl(var(--foreground))] underline underline-offset-2"
              href="/privacidad"
              target="_blank"
            >
              política de tratamiento de datos
            </Link>
            .
          </span>
        </label>
        {consentTouched && !consent ? (
          <p
            className="flex items-center gap-1.5 text-xs font-semibold text-[hsl(var(--danger))]"
            id="data-consent-error"
          >
            <AlertCircle aria-hidden="true" className="size-3.5 shrink-0" />
            Necesitamos tu autorización para poder guardar la reserva.
          </p>
        ) : null}
      </div>

      {blocked ? (
        <p
          className="flex items-start gap-2 rounded-2xl bg-[hsl(var(--surface)/0.72)] p-3 text-sm leading-6 text-[hsl(var(--muted))]"
          role="status"
        >
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          Falta {missingRequirements.join(" y ")} para poder reservar.
        </p>
      ) : null}

      <motion.div whileTap={reducedMotion ? undefined : { scale: 0.98 }}>
        <Button className="w-full" disabled={submitting || blocked} size="lg" type="submit">
          <Send aria-hidden="true" className="size-4" />
          {submitting ? "Reservando..." : "Solicitar reserva"}
        </Button>
      </motion.div>
    </form>
  );
}

function Field({
  name,
  label,
  hint,
  error,
  icon: Icon,
  children,
}: {
  name: FieldName;
  label: string;
  hint?: string;
  error?: string;
  icon: typeof UserRound;
  children: (props: { id: string; describedBy?: string; invalid: boolean }) => React.ReactNode;
}) {
  const id = `field-${name}`;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className="grid gap-2">
      <label className="text-sm font-bold text-[hsl(var(--muted))]" htmlFor={id}>
        {label}
      </label>
      <span className="relative block">
        <Icon
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[hsl(var(--muted))]"
        />
        {children({ id, describedBy, invalid: Boolean(error) })}
      </span>
      {hint && !error ? (
        <p className="text-xs text-[hsl(var(--muted))]" id={hintId}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="flex items-center gap-1.5 text-xs font-semibold text-[hsl(var(--danger))]" id={errorId}>
          <AlertCircle aria-hidden="true" className="size-3.5 shrink-0" />
          {error}
        </p>
      ) : null}
    </div>
  );
}

function inputClassName(invalid: boolean) {
  return cn(
    "focus-ring w-full rounded-2xl border bg-[hsl(var(--surface)/0.58)] px-11 py-3 text-[hsl(var(--foreground))] transition",
    invalid
      ? "border-[hsl(var(--danger)/0.62)] bg-[hsl(var(--danger)/0.05)]"
      : "border-[hsl(var(--border))] focus:border-[hsl(var(--primary)/0.5)]",
  );
}

/**
 * Deja el numero en 10 digitos nacionales.
 *
 * Cortar a 10 sin mas mutilaba a quien escribia el indicativo: "573001234567"
 * quedaba en "5730012345", un numero que no existe. Ahora el 57 inicial se
 * reconoce y se descarta.
 */
function formatPhone(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.length > 10 && digits.startsWith("57")) digits = digits.slice(2);
  digits = digits.slice(0, 10);
  return digits.replace(/(\d{3})(\d{0,3})(\d{0,4})/, (_match, a, b, c) => [a, b, c].filter(Boolean).join(" "));
}
