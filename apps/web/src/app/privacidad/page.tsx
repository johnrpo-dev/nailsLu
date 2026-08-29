import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { POLITICA_VERSION, RESPONSABLE } from "@/shared/lib/privacidad";

export const metadata: Metadata = {
  title: "Política de tratamiento de datos · NAILS LU SPA",
  description: "Cómo tratamos los datos personales de nuestras clientas.",
};

/**
 * Los datos del responsable viven en `shared/lib/privacidad.ts`.
 *
 * El texto describe lo que la app hace de verdad, no es una plantilla copiada
 * de internet, pero no lo ha revisado un abogado. Conviene que lo lea alguien
 * que sepa antes de que el sitio reciba clientas reales.
 */
export default function PoliticaPage() {
  return (
    <main className="mx-auto w-[min(760px,100%)] px-4 py-10 sm:px-6">
      <Link
        className="focus-ring inline-flex items-center gap-2 rounded-full text-sm font-bold text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
        href="/"
      >
        <ArrowLeft aria-hidden="true" className="size-4" /> Volver a reservar
      </Link>

      <h1 className="mt-6 text-3xl font-black tracking-tight sm:text-4xl">
        Política de tratamiento de datos personales
      </h1>
      <p className="mt-2 text-sm text-[hsl(var(--muted))]">
        Versión {POLITICA_VERSION} · Ley 1581 de 2012 y Decreto 1074 de 2015
      </p>

      <div className="mt-8 grid gap-8 text-[15px] leading-7">
        <section>
          <h2 className="text-xl font-black tracking-tight">Quién responde por tus datos</h2>
          <ul className="mt-3 grid gap-1 text-[hsl(var(--muted))]">
            <li><strong className="text-[hsl(var(--foreground))]">Negocio:</strong> {RESPONSABLE.nombre}</li>
            <li><strong className="text-[hsl(var(--foreground))]">Responsable:</strong> {RESPONSABLE.responsable}</li>
            {RESPONSABLE.identificacion ? (
              <li><strong className="text-[hsl(var(--foreground))]">Identificación:</strong> {RESPONSABLE.identificacion}</li>
            ) : null}
            {RESPONSABLE.direccion ? (
              <li><strong className="text-[hsl(var(--foreground))]">Dirección:</strong> {RESPONSABLE.direccion}, {RESPONSABLE.ciudad}</li>
            ) : (
              <li><strong className="text-[hsl(var(--foreground))]">Ciudad:</strong> {RESPONSABLE.ciudad}</li>
            )}
            <li><strong className="text-[hsl(var(--foreground))]">Correo:</strong> {RESPONSABLE.correo}</li>
            <li><strong className="text-[hsl(var(--foreground))]">WhatsApp:</strong> {RESPONSABLE.telefono}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-black tracking-tight">Qué datos recogemos</h2>
          <p className="mt-3 text-[hsl(var(--muted))]">
            Únicamente lo necesario para agendar y atender tu cita:
          </p>
          <ul className="mt-3 grid list-disc gap-1 pl-5 text-[hsl(var(--muted))]">
            <li>Tu nombre.</li>
            <li>Tu número de teléfono o WhatsApp.</li>
            <li>La nota que escribas voluntariamente sobre tu preferencia.</li>
            <li>Los servicios, la fecha y la hora que elijas.</li>
            <li>
              Si pides el servicio a domicilio, <strong className="text-[hsl(var(--foreground))]">tu dirección</strong>.
              Solo en ese caso: si eliges venir al spa, no te la pedimos ni la guardamos.
            </li>
          </ul>
          <p className="mt-3 text-[hsl(var(--muted))]">
            La dirección se usa únicamente para llegar a tu cita, se guarda junto a esa cita concreta y
            desaparece cuando la cita se elimina. No la compartimos con nadie.
          </p>
          <p className="mt-3 text-[hsl(var(--muted))]">
            No pedimos documento de identidad ni datos de pago. No recogemos datos sensibles.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-black tracking-tight">Para qué los usamos</h2>
          <ul className="mt-3 grid list-disc gap-1 pl-5 text-[hsl(var(--muted))]">
            <li>Agendar tu cita y reservar el horario.</li>
            <li>Contactarte para confirmar, recordar o reprogramar.</li>
            <li>Llevar el historial de tus visitas.</li>
          </ul>
          <p className="mt-3 text-[hsl(var(--muted))]">
            No vendemos, alquilamos ni compartimos tus datos con terceros con fines comerciales. No te
            enviamos publicidad salvo que lo autorices aparte.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-black tracking-tight">Cuánto tiempo los guardamos</h2>
          <p className="mt-3 text-[hsl(var(--muted))]">
            Mientras seas clienta y por el tiempo que exija la ley. Puedes pedir que los eliminemos
            cuando quieras. Los registros técnicos de intentos de reserva, que incluyen dirección IP y
            se usan solo para prevenir abuso del formulario, se borran automáticamente a los 30 días.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-black tracking-tight">Tus derechos</h2>
          <p className="mt-3 text-[hsl(var(--muted))]">Como titular de tus datos puedes:</p>
          <ul className="mt-3 grid list-disc gap-1 pl-5 text-[hsl(var(--muted))]">
            <li>Conocer qué datos tuyos tenemos.</li>
            <li>Actualizarlos o corregirlos si están mal.</li>
            <li>Pedir que los eliminemos.</li>
            <li>Revocar la autorización que nos diste.</li>
            <li>Presentar quejas ante la Superintendencia de Industria y Comercio.</li>
          </ul>
          <p className="mt-3 text-[hsl(var(--muted))]">
            Para ejercerlos escríbenos a {RESPONSABLE.correo} o al {RESPONSABLE.telefono}. Respondemos
            en los plazos que fija la ley.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-black tracking-tight">Cookies y almacenamiento</h2>
          <p className="mt-3 text-[hsl(var(--muted))]">
            Este sitio <strong className="text-[hsl(var(--foreground))]">no usa cookies</strong> ni
            herramientas de analítica o publicidad. Solo guardamos en tu navegador tu preferencia de
            tema claro u oscuro, que no te identifica y nunca sale de tu dispositivo.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-black tracking-tight">Cambios</h2>
          <p className="mt-3 text-[hsl(var(--muted))]">
            Si actualizamos esta política publicaremos aquí la versión nueva con su fecha. La versión
            que aceptaste al reservar queda registrada con tu cita.
          </p>
        </section>
      </div>
    </main>
  );
}
