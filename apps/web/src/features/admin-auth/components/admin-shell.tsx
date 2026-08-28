"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AlertCircle, CalendarClock, CalendarDays, ExternalLink, LogOut, Scissors, UserCog } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/shared/lib/cn";
import { useAdminSession } from "./admin-session-provider";

const SECCIONES = [
  { href: "/admin/bookings", etiqueta: "Reservas", icono: CalendarDays },
  { href: "/admin/services", etiqueta: "Servicios", icono: Scissors },
  { href: "/admin/availability", etiqueta: "Disponibilidad", icono: CalendarClock },
  { href: "/admin/cuenta", etiqueta: "Tu cuenta", icono: UserCog },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const { user, ready, logout, usingDefaultPassword } = useAdminSession();
  const pathname = usePathname();
  const router = useRouter();
  const esLogin = pathname === "/admin/login";

  // Rutas del panel protegidas en cliente. El API valida el JWT igualmente en
  // cada peticion, asi que esto es comodidad de navegacion, no la seguridad.
  useEffect(() => {
    if (ready && !user && !esLogin) router.replace("/admin/login");
  }, [esLogin, ready, router, user]);

  if (esLogin) return <>{children}</>;

  if (!ready) {
    return (
      <main className="mx-auto w-[min(1180px,100%)] px-4 py-6 sm:px-6">
        <Skeleton className="h-16 rounded-3xl" />
        <Skeleton className="mt-4 h-64 rounded-3xl" />
      </main>
    );
  }

  if (!user) return null;

  return (
    <div className="mx-auto w-[min(1180px,100%)] px-4 py-6 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-[1.75rem] border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.62)] px-4 py-3 backdrop-blur-xl">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[hsl(var(--muted))]">NAILS LU SPA</p>
          <p className="text-sm font-black">Hola, {user.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="ghost">
            <Link href="/" target="_blank">
              Ver sitio <ExternalLink aria-hidden="true" className="size-3.5" />
            </Link>
          </Button>
          <ThemeToggle />
          <Button onClick={logout} size="sm" type="button" variant="secondary">
            <LogOut aria-hidden="true" className="size-4" /> Salir
          </Button>
        </div>
      </header>

      {/* Con tres secciones las pestanas ya no caben en 375px: deben envolver. */}
      <nav aria-label="Secciones del panel" className="mt-4 flex flex-wrap gap-2">
        {SECCIONES.map(({ href, etiqueta, icono: Icono }) => {
          const activa = pathname === href;
          return (
            <Link
              aria-current={activa ? "page" : undefined}
              className={cn(
                "focus-ring inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition",
                activa
                  ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.12)]"
                  : "border-[hsl(var(--border))] bg-[hsl(var(--card)/0.6)] hover:border-[hsl(var(--primary)/0.45)]",
              )}
              href={href}
              key={href}
            >
              <Icono aria-hidden="true" className="size-4" />
              {etiqueta}
            </Link>
          );
        })}
      </nav>

      {usingDefaultPassword && pathname !== "/admin/cuenta" ? (
        <Link
          className="focus-ring mt-4 flex items-start gap-3 rounded-3xl border border-[hsl(var(--danger)/0.4)] bg-[hsl(var(--danger)/0.08)] p-4 transition hover:border-[hsl(var(--danger)/0.7)]"
          href="/admin/cuenta"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[hsl(var(--danger))]" />
          <span className="text-sm leading-6">
            <strong className="font-bold">Estás usando la contraseña de ejemplo.</strong> Viene en el
            código público del proyecto, así que cualquiera podría entrar aquí. Toca para cambiarla.
          </span>
        </Link>
      ) : null}

      <main className="mt-6">{children}</main>
    </div>
  );
}
