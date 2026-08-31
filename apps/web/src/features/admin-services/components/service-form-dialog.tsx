"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AlertCircle, Save, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/shared/api/client";
import { cn } from "@/shared/lib/cn";
import { formatDuration } from "@/shared/lib/format";
import { readToken } from "@/features/admin-auth/services/auth-storage";
import {
  addGalleryImage,
  removeGalleryImage,
  removeServiceImage,
  updateGalleryFraming,
  uploadServiceImage,
} from "../services/services-admin-api";
import { GaleriaEditor } from "./galeria-editor";
import { ImageFramer, type Encuadre } from "./image-framer";
import type { AdminService, ServiceInput } from "../services/services-admin-api";

/** Duraciones habituales del salon, para no teclear el numero cada vez. */
const ATAJOS_DURACION = [30, 45, 60, 90, 120];

export function ServiceFormDialog({
  open,
  service,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  /** null = crear uno nuevo. */
  service: AdminService | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: ServiceInput) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [encuadre, setEncuadre] = useState<Encuadre>({ imageFocalX: 50, imageFocalY: 50, imageScale: 100 });
  const [subiendo, setSubiendo] = useState(false);
  const [galeria, setGaleria] = useState<NonNullable<AdminService["images"]>>([]);

  // Al abrir se recarga el formulario con el servicio en edicion (o en blanco).
  useEffect(() => {
    if (!open) return;
    setName(service?.name ?? "");
    setDescription(service?.description ?? "");
    setDurationMinutes(service?.durationMinutes ?? 60);
    setImageUrl(service?.imageUrl ?? null);
    // Sin esto, al abrir otro servicio se verian las fotos del anterior.
    setGaleria(service?.images ?? []);
    setEncuadre({
      imageFocalX: service?.imageFocalX ?? 50,
      imageFocalY: service?.imageFocalY ?? 50,
      imageScale: service?.imageScale ?? 100,
    });
    setError("");
  }, [open, service]);

  const nombreValido = name.trim().length >= 2;
  const duracionValida = Number.isInteger(durationMinutes) && durationMinutes >= 5 && durationMinutes <= 480;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!nombreValido || !duracionValida) {
      setError(
        !nombreValido ? "El nombre debe tener al menos 2 letras." : "La duración debe estar entre 5 y 480 minutos.",
      );
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        durationMinutes,
        ...encuadre,
      });
      onOpenChange(false);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "No pudimos guardar el servicio.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog.Root onOpenChange={onOpenChange} open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[min(480px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[2rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <Dialog.Title className="text-xl font-black tracking-tight">
              {service ? "Editar servicio" : "Nuevo servicio"}
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button aria-label="Cerrar" size="icon" type="button" variant="ghost">
                <X aria-hidden="true" className="size-4" />
              </Button>
            </Dialog.Close>
          </div>
          <Dialog.Description className="mt-2 text-sm leading-6 text-[hsl(var(--muted))]">
            La duración define cuánto ocupa en la agenda y a qué hora termina la cita.
          </Dialog.Description>

          <form className="mt-5 grid gap-4" noValidate onSubmit={submit}>
            <label className="grid gap-2 text-sm font-bold text-[hsl(var(--muted))]" htmlFor="servicio-nombre">
              Nombre
              <input
                autoFocus
                className={inputClass}
                id="servicio-nombre"
                onChange={(event) => setName(event.target.value)}
                placeholder="Semipermanente"
                value={name}
              />
            </label>

            <label className="grid gap-2 text-sm font-bold text-[hsl(var(--muted))]" htmlFor="servicio-descripcion">
              Descripción (opcional)
              <textarea
                className={cn(inputClass, "min-h-20 resize-none")}
                id="servicio-descripcion"
                maxLength={300}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Qué incluye el servicio"
                value={description}
              />
            </label>

            <div className="grid gap-2">
              <label className="text-sm font-bold text-[hsl(var(--muted))]" htmlFor="servicio-duracion">
                Duración en minutos
              </label>
              <input
                className={inputClass}
                id="servicio-duracion"
                inputMode="numeric"
                max={480}
                min={5}
                onChange={(event) => setDurationMinutes(Number(event.target.value))}
                type="number"
                value={Number.isNaN(durationMinutes) ? "" : durationMinutes}
              />
              <div className="flex flex-wrap gap-2">
                {ATAJOS_DURACION.map((minutos) => (
                  <Button
                    key={minutos}
                    onClick={() => setDurationMinutes(minutos)}
                    size="sm"
                    type="button"
                    variant={durationMinutes === minutos ? "primary" : "secondary"}
                  >
                    {formatDuration(minutos)}
                  </Button>
                ))}
              </div>
            </div>

            {service ? (
              <ImageFramer
                encuadre={encuadre}
                imageUrl={imageUrl}
                ocupado={subiendo}
                onEncuadreChange={setEncuadre}
                onQuitar={async () => {
                  setSubiendo(true);
                  setError("");
                  try {
                    const actualizado = await removeServiceImage(service.id);
                    setImageUrl(actualizado.imageUrl ?? null);
                    setEncuadre({ imageFocalX: 50, imageFocalY: 50, imageScale: 100 });
                  } catch {
                    setError("No pudimos quitar la foto.");
                  } finally {
                    setSubiendo(false);
                  }
                }}
                onSubir={async (file) => {
                  setSubiendo(true);
                  setError("");
                  try {
                    const actualizado = await uploadServiceImage(service.id, file, readToken());
                    setImageUrl(actualizado.imageUrl ?? null);
                    setEncuadre({
                      imageFocalX: actualizado.imageFocalX ?? 50,
                      imageFocalY: actualizado.imageFocalY ?? 50,
                      imageScale: actualizado.imageScale ?? 100,
                    });
                  } catch (caught) {
                    setError(caught instanceof Error ? caught.message : "No pudimos subir la foto.");
                  } finally {
                    setSubiendo(false);
                  }
                }}
              />
            ) : (
              <p className="rounded-2xl bg-[hsl(var(--surface)/0.7)] p-3 text-sm leading-6 text-[hsl(var(--muted))]">
                Crea el servicio primero y luego podrás subirle una foto desde aquí.
              </p>
            )}

            {service ? (
              <GaleriaEditor
                fotos={galeria}
                hayPortada={Boolean(imageUrl)}
                ocupado={subiendo}
                onQuitar={async (imageId) => {
                  setSubiendo(true);
                  setError("");
                  try {
                    setGaleria((await removeGalleryImage(service.id, imageId)).images ?? []);
                  } catch {
                    setError("No pudimos quitar la foto.");
                  } finally {
                    setSubiendo(false);
                  }
                }}
                onReencuadrar={async (imageId, encuadre) => {
                  setSubiendo(true);
                  setError("");
                  try {
                    setGaleria((await updateGalleryFraming(service.id, imageId, encuadre)).images ?? []);
                  } catch {
                    setError("No pudimos guardar el encuadre.");
                  } finally {
                    setSubiendo(false);
                  }
                }}
                onSubir={async (file) => {
                  setSubiendo(true);
                  setError("");
                  try {
                    setGaleria((await addGalleryImage(service.id, file, readToken())).images ?? []);
                  } catch (caught) {
                    setError(caught instanceof Error ? caught.message : "No pudimos subir la foto.");
                  } finally {
                    setSubiendo(false);
                  }
                }}
              />
            ) : null}

            {error ? (
              <p
                className="flex items-start gap-2 rounded-2xl bg-[hsl(var(--danger)/0.08)] p-3 text-sm font-semibold text-[hsl(var(--danger))]"
                role="alert"
              >
                <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                {error}
              </p>
            ) : null}

            <Button className="mt-1" disabled={submitting} size="lg" type="submit">
              <Save aria-hidden="true" className="size-4" />
              {submitting ? "Guardando..." : service ? "Guardar cambios" : "Crear servicio"}
            </Button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

const inputClass = cn(
  "focus-ring w-full rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface)/0.58)]",
  "px-4 py-3 text-[hsl(var(--foreground))]",
);
