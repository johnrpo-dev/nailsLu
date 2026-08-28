import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { PrismaService } from "../../../prisma/prisma.service";

/** Carpeta donde viven las fotos. Fuera de `dist`, para sobrevivir a los builds. */
export const CARPETA_SUBIDAS = path.resolve(process.env.UPLOADS_DIR ?? "./uploads");

const TIPOS_ACEPTADOS = ["image/jpeg", "image/png", "image/webp"];
const MAXIMO_BYTES = 8 * 1024 * 1024;

@Injectable()
export class ServiceImagesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Guarda la foto de un servicio.
   *
   * La imagen se reprocesa a WebP con un lado maximo de 1200px: las fotos de
   * telefono pesan varios megas y en una tarjeta de 300px eso es puro gasto de
   * datos para la clienta. Reprocesar tambien descarta cualquier contenido
   * raro que venga incrustado en el archivo original.
   */
  async guardar(serviceId: string, archivo: { buffer: Buffer; mimetype: string; size: number }) {
    const servicio = await this.prisma.service.findUnique({
      where: { id: serviceId },
      select: { id: true, imageUrl: true },
    });
    if (!servicio) throw new NotFoundException("El servicio no existe");

    if (!TIPOS_ACEPTADOS.includes(archivo.mimetype)) {
      throw new BadRequestException("Solo se aceptan imágenes JPG, PNG o WebP");
    }
    if (archivo.size > MAXIMO_BYTES) {
      throw new BadRequestException("La imagen no puede pesar más de 8 MB");
    }

    let procesada: Buffer;
    try {
      procesada = await sharp(archivo.buffer)
        .rotate() // Respeta la orientación EXIF: si no, las fotos verticales salen giradas.
        .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
    } catch {
      throw new BadRequestException("No pudimos leer la imagen. ¿Está dañada?");
    }

    await fs.mkdir(CARPETA_SUBIDAS, { recursive: true });
    const nombre = `${serviceId}-${crypto.randomBytes(6).toString("hex")}.webp`;
    await fs.writeFile(path.join(CARPETA_SUBIDAS, nombre), procesada);

    // La anterior se borra para que la carpeta no crezca sin control.
    await this.borrarArchivo(servicio.imageUrl);

    return this.prisma.service.update({
      where: { id: serviceId },
      data: { imageUrl: `/uploads/${nombre}`, imageFocalX: 50, imageFocalY: 50, imageScale: 100 },
      select: CAMPOS_IMAGEN,
    });
  }

  async quitar(serviceId: string) {
    const servicio = await this.prisma.service.findUnique({
      where: { id: serviceId },
      select: { id: true, imageUrl: true },
    });
    if (!servicio) throw new NotFoundException("El servicio no existe");

    await this.borrarArchivo(servicio.imageUrl);
    return this.prisma.service.update({
      where: { id: serviceId },
      data: { imageUrl: null, imageFocalX: 50, imageFocalY: 50, imageScale: 100 },
      select: CAMPOS_IMAGEN,
    });
  }

  private async borrarArchivo(imageUrl: string | null) {
    if (!imageUrl) return;
    // Solo el nombre, nunca la ruta recibida: evita salir de la carpeta.
    const nombre = path.basename(imageUrl);
    try {
      await fs.unlink(path.join(CARPETA_SUBIDAS, nombre));
    } catch {
      // Si ya no estaba, no hay nada que hacer.
    }
  }
}

const CAMPOS_IMAGEN = {
  id: true,
  name: true,
  description: true,
  durationMinutes: true,
  isActive: true,
  sortOrder: true,
  imageUrl: true,
  imageFocalX: true,
  imageFocalY: true,
  imageScale: true,
} as const;
