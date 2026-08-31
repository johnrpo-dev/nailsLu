"use client";

import { useState } from "react";
import type { ServiceSummary } from "@spa/shared";
import { cn } from "@/shared/lib/cn";
import { fotosDeServicio } from "@/shared/lib/service-image";

/**
 * Fotos del servicio dentro de su tarjeta del catalogo.
 *
 * Existe para que se vea desde el principio que hay varios disenos. Antes las
 * fotos solo vivian en el detalle y la clienta no tenia como saberlo: habia que
 * tocar la tarjeta para descubrirlo, y nadie toca lo que no sabe que esconde
 * algo.
 *
 * Cada foto es un boton que abre el detalle. El desplazamiento es nativo, asi
 * que arrastrar pasa de foto y un toque abre: el navegador ya distingue las dos
 * cosas y no hace falta gestionar gestos a mano.
 *
 * Queda fuera del recorrido de Tab y del arbol de accesibilidad, igual que la
 * foto unica que habia antes: el boton de informacion de la tarjeta lleva al
 * mismo sitio y ya esta etiquetado.
 */
export function CarruselTarjeta({
  service,
  onAbrir,
}: {
  service: ServiceSummary;
  onAbrir: () => void;
}) {
  const fotos = fotosDeServicio(service);
  const [actual, setActual] = useState(0);

  if (!fotos.length) return null;

  return (
    <div aria-hidden="true" className="relative -m-4 mb-4">
      <div
        className="flex snap-x snap-mandatory overflow-x-auto rounded-t-[1.75rem] bg-[hsl(var(--surface))] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onScroll={(event) => {
          const pista = event.currentTarget;
          setActual(Math.round(pista.scrollLeft / pista.clientWidth));
        }}
      >
        {fotos.map((foto, indice) => (
          <button
            className="aspect-[4/5] w-full shrink-0 snap-center overflow-hidden"
            key={foto.url}
            onClick={onAbrir}
            tabIndex={-1}
            type="button"
          >
            <img
              alt=""
              className="size-full transition duration-500 group-hover:scale-[1.03]"
              loading={indice === 0 ? "eager" : "lazy"}
              src={foto.url}
              style={foto.estilo}
            />
          </button>
        ))}
      </div>

      {/*
        Los puntos son la senal de que hay mas. Van sobre la foto, con un fondo
        translucido, porque debajo se perderian entre el texto de la tarjeta.
      */}
      {fotos.length > 1 ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
          <div className="flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1.5 backdrop-blur-sm">
            {fotos.map((foto, indice) => (
              <span
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  indice === actual ? "w-4 bg-white" : "w-1.5 bg-white/55",
                )}
                key={foto.url}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
