"use client";

import { ImageOff, Move, Trash2, Upload, ZoomIn, ZoomOut } from "lucide-react";
import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Button } from "@/components/ui/button";
import { urlDeFoto } from "@/shared/lib/service-image";

export type Encuadre = { imageFocalX: number; imageFocalY: number; imageScale: number };

/**
 * 100 muestra la foto completa. No se baja de ahi: por debajo la imagen se
 * despegaria del marco, dejaria huecos y perderia la esquina redondeada.
 */
const ESCALA_MIN = 100;
const ESCALA_MAX = 250;

/**
 * Editor de encuadre de la foto.
 *
 * Las fotos de unas son primeros planos y el diseno rara vez cae en el centro,
 * asi que un recorte fijo cortaria justo lo que se quiere lucir. Aqui se
 * arrastra la foto dentro del marco y se acerca o aleja con el control de zoom.
 *
 * No se toca el archivo: solo se guardan el punto focal y la escala, asi que
 * reencuadrar cuantas veces haga falta no pierde calidad.
 */
export function ImageFramer({
  imageUrl,
  encuadre,
  onEncuadreChange,
  onSubir,
  onQuitar,
  ocupado,
}: {
  imageUrl?: string | null;
  encuadre: Encuadre;
  onEncuadreChange: (encuadre: Encuadre) => void;
  onSubir: (file: File) => void;
  onQuitar: () => void;
  ocupado: boolean;
}) {
  const marcoRef = useRef<HTMLDivElement>(null);
  const archivoRef = useRef<HTMLInputElement>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const url = urlDeFoto(imageUrl);

  function iniciarArrastre(event: ReactPointerEvent<HTMLDivElement>) {
    if (!url) return;
    const marco = marcoRef.current;
    if (!marco) return;

    marco.setPointerCapture(event.pointerId);
    setArrastrando(true);

    // Las coordenadas del puntero se guardan aparte del encuadre: mezclarlas
    // colaba `x` e `y` en el objeto que se envia al API, que las rechaza.
    const origen = { x: event.clientX, y: event.clientY };
    const inicio = { ...encuadre };
    const { width, height } = marco.getBoundingClientRect();

    const mover = (e: PointerEvent) => {
      // El desplazamiento se convierte a porcentaje del marco. Se invierte
      // porque `objectPosition` mueve el recorte, no la foto: arrastrar a la
      // derecha debe traer hacia la vista la parte izquierda.
      const dx = ((e.clientX - origen.x) / width) * 100;
      const dy = ((e.clientY - origen.y) / height) * 100;
      onEncuadreChange({
        ...inicio,
        imageFocalX: Math.round(Math.min(100, Math.max(0, inicio.imageFocalX - dx))),
        imageFocalY: Math.round(Math.min(100, Math.max(0, inicio.imageFocalY - dy))),
      });
    };

    const soltar = () => {
      setArrastrando(false);
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
    };

    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
  }

  function cambiarEscala(delta: number) {
    onEncuadreChange({
      ...encuadre,
      imageScale: Math.min(ESCALA_MAX, Math.max(ESCALA_MIN, encuadre.imageScale + delta)),
    });
  }

  return (
    <div className="grid gap-3">
      <span className="text-sm font-bold text-[hsl(var(--muted))]">Foto del servicio</span>

      <div
        className={[
          "relative aspect-[4/5] w-full max-w-[15rem] overflow-hidden rounded-2xl border",
          "border-[hsl(var(--border))] bg-[hsl(var(--surface))]",
          url ? (arrastrando ? "cursor-grabbing" : "cursor-grab") : "",
        ].join(" ")}
        onPointerDown={iniciarArrastre}
        ref={marcoRef}
      >
        {url ? (
          <>
            <img
              alt="Vista previa"
              className="size-full select-none"
              draggable={false}
              src={url}
              style={{
                objectFit: "contain",
                objectPosition: `${encuadre.imageFocalX}% ${encuadre.imageFocalY}%`,
                transform: encuadre.imageScale === 100 ? undefined : `scale(${encuadre.imageScale / 100})`,
              }}
            />
            {!arrastrando ? (
              <span className="pointer-events-none absolute inset-x-2 bottom-2 flex items-center justify-center gap-1.5 rounded-full bg-black/55 py-1.5 text-xs font-semibold text-white">
                <Move aria-hidden="true" className="size-3.5" /> Arrastra para encuadrar
              </span>
            ) : null}
          </>
        ) : (
          <span className="grid size-full place-items-center gap-2 text-center text-sm text-[hsl(var(--muted))]">
            <ImageOff aria-hidden="true" className="mx-auto size-6" />
            Sin foto
          </span>
        )}
      </div>

      {url ? (
        <div className="grid max-w-[15rem] gap-2">
          <div className="flex items-center gap-2">
            <Button
              aria-label="Alejar"
              onClick={() => cambiarEscala(-10)}
              size="icon"
              type="button"
              variant="secondary"
            >
              <ZoomOut aria-hidden="true" className="size-4" />
            </Button>
            <input
              aria-label="Nivel de acercamiento"
              className="focus-ring h-2 flex-1 cursor-pointer appearance-none rounded-full bg-[hsl(var(--border))] accent-[hsl(var(--primary))]"
              max={ESCALA_MAX}
              min={ESCALA_MIN}
              onChange={(e) => onEncuadreChange({ ...encuadre, imageScale: Number(e.target.value) })}
              step={5}
              type="range"
              value={encuadre.imageScale}
            />
            <Button
              aria-label="Acercar"
              onClick={() => cambiarEscala(10)}
              size="icon"
              type="button"
              variant="secondary"
            >
              <ZoomIn aria-hidden="true" className="size-4" />
            </Button>
          </div>
          <button
            className="focus-ring justify-self-start rounded-full text-xs font-bold text-[hsl(var(--muted))] underline underline-offset-2 hover:text-[hsl(var(--foreground))]"
            onClick={() => onEncuadreChange({ ...encuadre, imageFocalX: 50, imageFocalY: 50 })}
            type="button"
          >
            Centrar de nuevo
          </button>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <input
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onSubir(file);
            // Se limpia para que volver a elegir el mismo archivo dispare el cambio.
            e.target.value = "";
          }}
          ref={archivoRef}
          type="file"
        />
        <Button disabled={ocupado} onClick={() => archivoRef.current?.click()} size="sm" type="button" variant="secondary">
          <Upload aria-hidden="true" className="size-4" />
          {ocupado ? "Subiendo..." : url ? "Cambiar foto" : "Subir foto"}
        </Button>
        {url ? (
          <Button disabled={ocupado} onClick={onQuitar} size="sm" type="button" variant="secondary">
            <Trash2 aria-hidden="true" className="size-4" /> Quitar
          </Button>
        ) : null}
      </div>
    </div>
  );
}
