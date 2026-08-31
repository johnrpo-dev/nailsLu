"use client";

import { ImagePlus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { prepararFoto } from "@/shared/lib/preparar-foto";
import { urlDeFoto } from "@/shared/lib/service-image";

/** Portada incluida. Debe coincidir con el limite del API. */
const MAXIMO_FOTOS = 6;

/**
 * Fotos adicionales de un servicio.
 *
 * La portada se gestiona aparte, con su encuadre, porque es la que se recorta
 * en la tarjeta del catalogo. Estas se ven completas en el detalle, asi que no
 * necesitan reencuadre y basta con subirlas y quitarlas.
 *
 * El tope se cuenta con la portada dentro: seis fotos por servicio bastan para
 * mostrar variedad sin que la duena invierta una tarde por servicio.
 */
export function GaleriaEditor({
  fotos,
  hayPortada,
  ocupado,
  onQuitar,
  onSubir,
}: {
  fotos: { id: string; url: string }[];
  hayPortada: boolean;
  ocupado: boolean;
  onQuitar: (imageId: string) => Promise<void>;
  onSubir: (file: File) => Promise<void>;
}) {
  const entrada = useRef<HTMLInputElement>(null);
  const [preparando, setPreparando] = useState(false);

  const usadas = fotos.length + (hayPortada ? 1 : 0);
  const quedan = MAXIMO_FOTOS - usadas;
  const trabajando = ocupado || preparando;

  return (
    <div className="grid gap-3 rounded-2xl bg-[hsl(var(--surface)/0.7)] p-4">
      <div>
        <p className="text-sm font-black">Más fotos de este servicio</p>
        <p className="mt-1 text-sm leading-6 text-[hsl(var(--muted))]">
          {hayPortada
            ? "Se muestran en el detalle, junto a la portada, para que la clienta vea variedad de diseños."
            : "Sube primero la portada: es la que aparece en la tarjeta del catálogo."}
        </p>
      </div>

      {fotos.length ? (
        <ul className="grid grid-cols-3 gap-2">
          {fotos.map((foto, indice) => (
            <li className="relative" key={foto.id}>
              <div className="aspect-square overflow-hidden rounded-xl bg-[hsl(var(--card))]">
                <img
                  alt={`Foto ${indice + 1}`}
                  className="size-full object-cover"
                  loading="lazy"
                  src={urlDeFoto(foto.url) as string}
                />
              </div>
              <button
                aria-label={`Quitar foto ${indice + 1}`}
                className="focus-ring absolute right-1 top-1 grid size-8 place-items-center rounded-full bg-[hsl(var(--danger))] text-[hsl(var(--danger-foreground))] shadow"
                disabled={trabajando}
                onClick={() => onQuitar(foto.id)}
                type="button"
              >
                <Trash2 aria-hidden="true" className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <input
        accept="image/*"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;

          /*
           * Se reduce antes de subir: una foto de celular pesa entre 5 y 25 MB
           * y con datos moviles la subida se corta.
           */
          setPreparando(true);
          try {
            await onSubir(await prepararFoto(file));
          } finally {
            setPreparando(false);
          }
        }}
        ref={entrada}
        type="file"
      />

      <div className="flex flex-wrap items-center gap-3">
        <Button
          disabled={trabajando || quedan <= 0 || !hayPortada}
          onClick={() => entrada.current?.click()}
          size="sm"
          type="button"
          variant="secondary"
        >
          <ImagePlus aria-hidden="true" className="size-4" />
          {preparando ? "Preparando…" : "Añadir foto"}
        </Button>
        <span className="text-xs font-semibold text-[hsl(var(--muted))]">
          {quedan > 0 ? `Puedes añadir ${quedan} más` : "Llegaste al máximo de 6"}
        </span>
      </div>
    </div>
  );
}
