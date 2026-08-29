/**
 * Reduce una foto en el navegador antes de subirla.
 *
 * Las fotos de celular pesan entre 5 y 25 MB, y subir eso con datos moviles es
 * lento y se corta con facilidad. En la tarjeta se muestra a unos 300px, asi
 * que 2000px de lado mayor sobra incluso en pantallas retina: el archivo baja a
 * unos pocos cientos de kilobytes y la subida es casi instantanea.
 *
 * Si el navegador no sabe decodificar el formato (por ejemplo HEIC en algunos
 * Android), devuelve el archivo original y deja que lo procese el servidor.
 */

const LADO_MAXIMO = 2000;
const CALIDAD = 0.85;

export async function prepararFoto(file: File): Promise<File> {
  try {
    // `imageOrientation` aplica la rotacion EXIF al decodificar; sin esto las
    // fotos verticales del celular se suben acostadas.
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });

    const escala = Math.min(1, LADO_MAXIMO / Math.max(bitmap.width, bitmap.height));
    const ancho = Math.round(bitmap.width * escala);
    const alto = Math.round(bitmap.height * escala);

    const lienzo = document.createElement("canvas");
    lienzo.width = ancho;
    lienzo.height = alto;
    const ctx = lienzo.getContext("2d");
    if (!ctx) return file;

    ctx.drawImage(bitmap, 0, 0, ancho, alto);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      lienzo.toBlob(resolve, "image/webp", CALIDAD),
    );
    if (!blob) return file;

    // Si el original ya era mas liviano, no tiene sentido reemplazarlo.
    if (blob.size >= file.size) return file;

    return new File([blob], reemplazarExtension(file.name), { type: "image/webp" });
  } catch {
    return file;
  }
}

function reemplazarExtension(nombre: string) {
  return `${nombre.replace(/\.[^.]+$/, "")}.webp`;
}
