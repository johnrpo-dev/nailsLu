"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { useRef, useState } from "react";
import type { ServiceSummary } from "@spa/shared";
import { cn } from "@/shared/lib/cn";
import { fotosDeServicio } from "@/shared/lib/service-image";

/**
 * Carrusel de fotos del servicio.
 *
 * No avanza solo. Un carrusel automatico aparta la foto justo cuando la clienta
 * la esta mirando para decidir, y ademas incumple la pauta de accesibilidad que
 * exige poder detener cualquier movimiento (WCAG 2.2.2).
 *
 * El desplazamiento es nativo con `scroll-snap`: en el movil se pasa con el
 * dedo sin necesidad de codigo, y en escritorio hay flechas. La siguiente foto
 * asoma por el borde, que es lo que avisa de que hay mas sin tener que moverse.
 */
export function GaleriaServicio({ service }: { service: ServiceSummary }) {
  const fotos = fotosDeServicio(service);
  const [actual, setActual] = useState(0);
  const pistaRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  if (!fotos.length) return null;

  // Con una sola foto no hay nada que recorrer: se muestra y ya.
  if (fotos.length === 1) {
    return (
      <div className="mt-5 aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-[hsl(var(--surface))]">
        <img alt={service.name} className="size-full" src={fotos[0].url} style={fotos[0].estilo} />
      </div>
    );
  }

  function irA(indice: number) {
    const acotado = Math.min(Math.max(indice, 0), fotos.length - 1);
    setActual(acotado);
    const pista = pistaRef.current;
    /*
     * `behavior: "smooth"` ignora la preferencia del sistema, a diferencia de
     * la regla CSS: hay que consultarla a mano o quien pidio menos movimiento
     * lo recibe igual.
     */
    pista?.scrollTo({
      left: acotado * pista.clientWidth,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }

  return (
    <div className="mt-5">
      <div className="relative">
        <div
          aria-label={`Fotos de ${service.name}`}
          className="flex snap-x snap-mandatory overflow-x-auto rounded-[1.5rem] bg-[hsl(var(--surface))] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onScroll={(event) => {
            // El indicador sigue al dedo: el scroll nativo es la fuente de
            // verdad, no al reves.
            const pista = event.currentTarget;
            setActual(Math.round(pista.scrollLeft / pista.clientWidth));
          }}
          ref={pistaRef}
          role="group"
        >
          {fotos.map((foto, indice) => (
            <div className="aspect-[4/5] w-full shrink-0 snap-center overflow-hidden" key={foto.url}>
              <img
                alt={`${service.name}, foto ${indice + 1} de ${fotos.length}`}
                className="size-full"
                loading={indice === 0 ? "eager" : "lazy"}
                src={foto.url}
                /*
                  `cover` y no `contain`: contain deja franjas vacias y esquinas
                  cuadradas segun la proporcion de cada foto, que es el defecto
                  que ya se corrigio para la portada. El encuadre decide que
                  parte se ve.
                */
                style={foto.estilo}
              />
            </div>
          ))}
        </div>

        {/* Las flechas son para raton: en el movil se pasa con el dedo. */}
        <div className="pointer-events-none absolute inset-y-0 left-0 right-0 hidden items-center justify-between px-2 sm:flex">
          <Flecha
            alEtiquetar="Foto anterior"
            disabled={actual === 0}
            onClick={() => irA(actual - 1)}
          >
            <ChevronLeft aria-hidden="true" className="size-5" />
          </Flecha>
          <Flecha
            alEtiquetar="Foto siguiente"
            disabled={actual === fotos.length - 1}
            onClick={() => irA(actual + 1)}
          >
            <ChevronRight aria-hidden="true" className="size-5" />
          </Flecha>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-center gap-2">
        {fotos.map((foto, indice) => (
          <button
            aria-current={indice === actual}
            aria-label={`Ver foto ${indice + 1}`}
            className={cn(
              "focus-ring h-2 rounded-full transition-all",
              indice === actual
                ? "w-6 bg-[hsl(var(--primary))]"
                : "w-2 bg-[hsl(var(--border))] hover:bg-[hsl(var(--primary)/0.5)]",
            )}
            key={foto.url}
            onClick={() => irA(indice)}
            type="button"
          />
        ))}
      </div>
    </div>
  );
}

function Flecha({
  alEtiquetar,
  children,
  disabled,
  onClick,
}: {
  alEtiquetar: string;
  children: React.ReactNode;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={alEtiquetar}
      className={cn(
        "focus-ring pointer-events-auto grid size-9 place-items-center rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.92)] shadow-sm transition",
        disabled ? "invisible" : "hover:border-[hsl(var(--primary))]",
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}
