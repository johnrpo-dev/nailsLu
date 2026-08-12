import fs from "node:fs";
import path from "node:path";
import Image from "next/image";
import { BrandWordmark } from "./brand-wordmark";

/**
 * Logo de la marca.
 *
 * Componente de servidor: mira si existe el archivo del logo en `public/brand`
 * y, si no esta, cae en el logotipo tipografico. Asi la cabecera nunca muestra
 * una imagen rota y basta con dejar el archivo para que aparezca.
 *
 * Orden de preferencia: SVG (nitido a cualquier tamano) antes que los rasters.
 */
const CANDIDATOS = ["logo.svg", "logo.png", "logo.webp"];

function buscarLogo() {
  for (const archivo of CANDIDATOS) {
    if (fs.existsSync(path.join(process.cwd(), "public", "brand", archivo))) {
      return `/brand/${archivo}`;
    }
  }
  return null;
}

export function BrandLogo({ size = 44 }: { size?: number }) {
  const src = buscarLogo();

  if (!src) {
    return <BrandWordmark size="sm" />;
  }

  return (
    <Image
      alt="NAILS LU SPA"
      className="h-auto w-auto object-contain"
      height={size}
      // El logo es circular sobre fondo transparente: no lleva recorte ni placa.
      priority
      src={src}
      style={{ maxHeight: size }}
      width={size}
    />
  );
}
