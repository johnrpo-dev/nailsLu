"use client";

import { ImagePlus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { prepararFoto } from "@/shared/lib/preparar-foto";
import { estiloDeEncuadre, urlDeFoto } from "@/shared/lib/service-image";
import { cn } from "@/shared/lib/cn";
import { ImageFramer, type Encuadre } from "./image-framer";

/** Portada incluida. Debe coincidir con el limite del API. */
const MAXIMO_FOTOS = 6;

/**
 * Fotos adicionales de un servicio.
 *
 * La portada se gestiona aparte porque es la unica que se ve con la tarjeta
 * sin tocar. Estas llevan su propio encuadre por el mismo motivo que ella:
 * todas llenan el marco, y sin punto focal el recorte se come el diseno.
 *
 * El tope se cuenta con la portada dentro: seis fotos por servicio bastan para
 * mostrar variedad sin que la duena invierta una tarde por servicio.
 */
type FotoGaleria = {
  id: string;
  url: string;
  imageFocalX?: number;
  imageFocalY?: number;
  imageScale?: number;
};

export function GaleriaEditor({
  fotos,
  hayPortada,
  ocupado,
  onQuitar,
  onReencuadrar,
  onSubir,
}: {
  fotos: FotoGaleria[];
  hayPortada: boolean;
  ocupado: boolean;
  onQuitar: (imageId: string) => Promise<void>;
  onReencuadrar: (imageId: string, encuadre: Encuadre) => Promise<void>;
  onSubir: (file: File) => Promise<void>;
}) {
  const entrada = useRef<HTMLInputElement>(null);
  const [preparando, setPreparando] = useState(false);
  /** Foto abierta en el reencuadre. Solo una a la vez, para no llenar la pantalla. */
  const [editando, setEditando] = useState<string | null>(null);
  /*
   * El encuadre se lleva en local mientras se arrastra y solo se guarda al
   * pulsar: `ImageFramer` avisa en cada movimiento del dedo, y mandar una
   * peticion por cada uno saturaria el servidor sin ninguna ganancia.
   */
  const [borrador, setBorrador] = useState<Encuadre | null>(null);
  const [guardando, setGuardando] = useState(false);

  const seleccionada = fotos.find((foto) => foto.id === editando) ?? null;

  function abrir(foto: FotoGaleria) {
    if (editando === foto.id) {
      setEditando(null);
      setBorrador(null);
      return;
    }
    setEditando(foto.id);
    setBorrador({
      imageFocalX: foto.imageFocalX ?? 50,
      imageFocalY: foto.imageFocalY ?? 50,
      imageScale: foto.imageScale ?? 100,
    });
  }

  const usadas = fotos.length + (hayPortada ? 1 : 0);
  const quedan = MAXIMO_FOTOS - usadas;
  const trabajando = ocupado || preparando;

  return (
    <div className="grid gap-3 rounded-2xl bg-[hsl(var(--surface)/0.7)] p-4">
      <div>
        <p className="text-sm font-black">Más fotos de este servicio</p>
        <p className="mt-1 text-sm leading-6 text-[hsl(var(--muted))]">
          {hayPortada
            ? "Se ven en la tarjeta y en el detalle, junto a la portada. Toca una para ajustar su encuadre."
            : "Sube primero la portada: es la que aparece cuando la tarjeta está sin tocar."}
        </p>
      </div>

      {fotos.length ? (
        <ul className="grid grid-cols-3 gap-2">
          {fotos.map((foto, indice) => (
            <li className="relative" key={foto.id}>
              <button
                aria-label={`Ajustar el encuadre de la foto ${indice + 1}`}
                aria-pressed={editando === foto.id}
                className={cn(
                  "focus-ring block aspect-square w-full overflow-hidden rounded-xl border-2 bg-[hsl(var(--card))]",
                  editando === foto.id ? "border-[hsl(var(--primary))]" : "border-transparent",
                )}
                onClick={() => abrir(foto)}
                type="button"
              >
                <img
                  alt={`Foto ${indice + 1}`}
                  className="size-full"
                  loading="lazy"
                  src={urlDeFoto(foto.url) as string}
                  style={estiloDeEncuadre(foto)}
                />
              </button>
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

      {/*
        El reencuadre se abre bajo la cuadricula, no en otra ventana: asi se ve
        a la vez la foto grande y las miniaturas, y se nota cual se esta
        ajustando.
      */}
      {seleccionada && borrador ? (
        <div className="grid gap-3">
          <ImageFramer
            encuadre={borrador}
            imageUrl={seleccionada.url}
            ocupado={trabajando || guardando}
            onEncuadreChange={setBorrador}
            onQuitar={() => onQuitar(seleccionada.id)}
          />
          <Button
            disabled={guardando || trabajando}
            onClick={async () => {
              setGuardando(true);
              try {
                await onReencuadrar(seleccionada.id, borrador);
                setEditando(null);
                setBorrador(null);
              } finally {
                setGuardando(false);
              }
            }}
            size="sm"
            type="button"
          >
            {guardando ? "Guardando…" : "Guardar encuadre"}
          </Button>
        </div>
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
