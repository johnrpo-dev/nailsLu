"use client";

import { AlertCircle, Clock3, Eye, EyeOff, Pencil, Plus, RotateCw, Scissors } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/shared/api/client";
import { cn } from "@/shared/lib/cn";
import { formatDuration } from "@/shared/lib/format";
import {
  createService,
  deactivateService,
  listAdminServices,
  updateService,
  type AdminService,
  type ServiceInput,
} from "../services/services-admin-api";
import { ServiceFormDialog } from "./service-form-dialog";

export function ServicesManager() {
  const [services, setServices] = useState<AdminService[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [recarga, setRecarga] = useState(0);
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [enEdicion, setEnEdicion] = useState<AdminService | null>(null);
  const [cambiando, setCambiando] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");

    listAdminServices(controller.signal)
      .then((items) => {
        if (controller.signal.aborted) return;
        setServices(items);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (error instanceof ApiError && error.status === 401) return;
        setStatus("error");
        setErrorMessage(error instanceof ApiError ? error.message : "No pudimos cargar los servicios.");
      });

    return () => controller.abort();
  }, [recarga]);

  const guardar = useCallback(
    async (input: ServiceInput) => {
      if (enEdicion) {
        const actualizado = await updateService(enEdicion.id, input);
        setServices((actuales) => actuales.map((s) => (s.id === actualizado.id ? actualizado : s)));
        showToast({ title: `"${actualizado.name}" actualizado` });
      } else {
        const creado = await createService(input);
        setServices((actuales) => [...actuales, creado]);
        showToast({ title: `"${creado.name}" creado` });
      }
    },
    [enEdicion, showToast],
  );

  const alternarActivo = useCallback(
    async (service: AdminService) => {
      setCambiando(service.id);
      try {
        const actualizado = service.isActive
          ? await deactivateService(service.id)
          : await updateService(service.id, { isActive: true });
        setServices((actuales) => actuales.map((s) => (s.id === actualizado.id ? actualizado : s)));
        showToast({
          title: actualizado.isActive ? `"${actualizado.name}" visible` : `"${actualizado.name}" oculto`,
          description: actualizado.isActive
            ? "Las clientas ya pueden reservarlo."
            : "Deja de aparecer en el sitio, pero se conserva el historial.",
        });
      } catch (error) {
        showToast({
          title: "No pudimos cambiar el servicio",
          description: error instanceof ApiError ? error.message : "Intenta de nuevo.",
          variant: "error",
        });
      } finally {
        setCambiando(null);
      }
    },
    [showToast],
  );

  function abrirNuevo() {
    setEnEdicion(null);
    setDialogoAbierto(true);
  }

  function abrirEdicion(service: AdminService) {
    setEnEdicion(service);
    setDialogoAbierto(true);
  }

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Servicios</h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted))]">
            Define qué ofreces y cuánto dura cada cosa. Los precios se acuerdan aparte con cada clienta.
          </p>
        </div>
        <Button onClick={abrirNuevo} type="button">
          <Plus aria-hidden="true" className="size-4" /> Nuevo servicio
        </Button>
      </div>

      <div className="mt-5">
        {status === "loading" ? (
          <div className="grid gap-3">
            {[1, 2, 3].map((item) => (
              <Skeleton className="h-20 rounded-3xl" key={item} />
            ))}
          </div>
        ) : status === "error" ? (
          <div className="grid justify-items-start gap-3 rounded-3xl border border-[hsl(var(--danger)/0.32)] bg-[hsl(var(--danger)/0.06)] p-6">
            <p className="flex items-start gap-2 font-bold">
              <AlertCircle aria-hidden="true" className="mt-0.5 size-5 text-[hsl(var(--danger))]" />
              {errorMessage}
            </p>
            <Button onClick={() => setRecarga((n) => n + 1)} type="button" variant="secondary">
              <RotateCw aria-hidden="true" className="size-4" /> Reintentar
            </Button>
          </div>
        ) : !services.length ? (
          <div className="grid justify-items-start gap-2 rounded-3xl border border-dashed border-[hsl(var(--border))] p-8">
            <Scissors aria-hidden="true" className="size-6 text-[hsl(var(--muted))]" />
            <p className="text-base font-bold">Aún no hay servicios</p>
            <p className="max-w-prose text-sm leading-7 text-[hsl(var(--muted))]">
              Crea el primero y aparecerá de inmediato en el sitio para que las clientas puedan reservarlo.
            </p>
          </div>
        ) : (
          <ul className="grid gap-3">
            {services.map((service) => (
              <li
                className={cn(
                  "grid gap-4 rounded-3xl border p-4 sm:grid-cols-[1fr_auto] sm:items-center",
                  service.isActive
                    ? "border-[hsl(var(--border))] bg-[hsl(var(--card)/0.72)]"
                    : "border-dashed border-[hsl(var(--border))] bg-[hsl(var(--surface)/0.4)]",
                )}
                key={service.id}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className={cn("text-lg font-black", !service.isActive && "text-[hsl(var(--muted))]")}>
                      {service.name}
                    </h2>
                    <Badge>
                      <Clock3 aria-hidden="true" className="size-3.5" />
                      {formatDuration(service.durationMinutes)}
                    </Badge>
                    {!service.isActive ? <Badge>Oculto</Badge> : null}
                  </div>
                  {service.description ? (
                    <p className="mt-1 text-sm leading-6 text-[hsl(var(--muted))]">{service.description}</p>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <Button onClick={() => abrirEdicion(service)} size="sm" type="button" variant="secondary">
                    <Pencil aria-hidden="true" className="size-4" /> Editar
                  </Button>
                  <Button
                    disabled={cambiando === service.id}
                    onClick={() => alternarActivo(service)}
                    size="sm"
                    type="button"
                    variant="secondary"
                  >
                    {service.isActive ? (
                      <>
                        <EyeOff aria-hidden="true" className="size-4" /> Ocultar
                      </>
                    ) : (
                      <>
                        <Eye aria-hidden="true" className="size-4" /> Mostrar
                      </>
                    )}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ServiceFormDialog
        onOpenChange={setDialogoAbierto}
        onSubmit={guardar}
        open={dialogoAbierto}
        service={enEdicion}
      />
    </section>
  );
}
