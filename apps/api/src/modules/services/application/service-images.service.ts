import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { PrismaService } from "../../../prisma/prisma.service";

/** Carpeta donde viven las fotos. Fuera de `dist`, para sobrevivir a los builds. */
export const CARPETA_SUBIDAS = path.resolve(process.env.UPLOADS_DIR ?? "./uploads");

/**
 * Formatos que acepta el servidor.
 *
 * HEIC y HEIF entran porque es lo que dispara un iPhone por defecto. La web
 * reduce la foto antes de subirla, pero si el navegador no supo decodificarla
 * llega el original y sharp si sabe leerlo.
 */
const TIPOS_ACEPTADOS = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/avif",
];

/**
 * Tope generoso a proposito: es una red de seguridad, no el camino normal. Una
 * foto de celular sin reducir ronda los 5-25 MB y los telefonos de mas
 * megapixeles pasan de ahi.
 */
const MAXIMO_BYTES = 30 * 1024 * 1024;

/** Fotos por servicio, portada incluida. */
const MAXIMO_FOTOS = 6;

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
      throw new BadRequestException("La imagen no puede pesar más de 30 MB");
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
      /**
       * Escala 100 y centro: con `object-fit: cover` eso ya llena el marco
       * entero, venga la foto como venga. Desde ahi se reencuadra a mano.
       */
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

  /**
   * Anade una foto al carrusel de un servicio.
   *
   * El tope incluye la portada: seis fotos por servicio es suficiente para
   * mostrar variedad y evita que la duena invierta horas en algo que nadie mira
   * entero. Tambien mantiene el detalle ligero de cargar en datos moviles.
   */
  async anadirAlCarrusel(serviceId: string, archivo: { buffer: Buffer; mimetype: string; size: number }) {
    const servicio = await this.prisma.service.findUnique({
      where: { id: serviceId },
      select: { id: true, imageUrl: true, _count: { select: { images: true } } },
    });
    if (!servicio) throw new NotFoundException("El servicio no existe");

    const yaTiene = servicio._count.images + (servicio.imageUrl ? 1 : 0);
    if (yaTiene >= MAXIMO_FOTOS) {
      throw new BadRequestException(`Cada servicio admite hasta ${MAXIMO_FOTOS} fotos`);
    }

    const url = await this.procesarYGuardar(serviceId, archivo);
    const ultima = await this.prisma.serviceImage.findFirst({
      where: { serviceId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    await this.prisma.serviceImage.create({
      data: { serviceId, url, sortOrder: (ultima?.sortOrder ?? 0) + 1 },
    });

    return this.prisma.service.findUnique({ where: { id: serviceId }, select: CAMPOS_IMAGEN });
  }

  /**
   * Reencuadra una foto del carrusel.
   *
   * Las tres propiedades son las mismas que las de la portada: punto focal en
   * cada eje y escala. No se vuelve a tocar el archivo, solo como se muestra.
   */
  async reencuadrar(
    serviceId: string,
    imageId: string,
    encuadre: { imageFocalX: number; imageFocalY: number; imageScale: number },
  ) {
    const foto = await this.prisma.serviceImage.findFirst({
      where: { id: imageId, serviceId },
      select: { id: true },
    });
    if (!foto) throw new NotFoundException("La foto ya no existe");

    await this.prisma.serviceImage.update({
      where: { id: foto.id },
      data: {
        imageFocalX: encuadre.imageFocalX,
        imageFocalY: encuadre.imageFocalY,
        // Nunca por debajo de 100: encoger despegaria la foto del marco.
        imageScale: Math.max(100, encuadre.imageScale),
      },
    });

    return this.prisma.service.findUnique({ where: { id: serviceId }, select: CAMPOS_IMAGEN });
  }

  /** Quita una foto del carrusel. La portada se quita con `quitar`. */
  async quitarDelCarrusel(serviceId: string, imageId: string) {
    const foto = await this.prisma.serviceImage.findFirst({
      where: { id: imageId, serviceId },
      select: { id: true, url: true },
    });
    if (!foto) throw new NotFoundException("La foto ya no existe");

    await this.prisma.serviceImage.delete({ where: { id: foto.id } });
    await this.borrarArchivo(foto.url);

    return this.prisma.service.findUnique({ where: { id: serviceId }, select: CAMPOS_IMAGEN });
  }

  /**
   * Valida, reprocesa y escribe el archivo. Devuelve la ruta publica.
   *
   * Lo comparten la portada y el carrusel: son la misma operacion, y duplicarla
   * habria dejado dos sitios donde recordar el limite de tamano y los formatos
   * que acepta un iPhone.
   */
  private async procesarYGuardar(
    serviceId: string,
    archivo: { buffer: Buffer; mimetype: string; size: number },
  ) {
    if (!TIPOS_ACEPTADOS.includes(archivo.mimetype)) {
      throw new BadRequestException("Solo se aceptan imágenes JPG, PNG o WebP");
    }
    if (archivo.size > MAXIMO_BYTES) {
      throw new BadRequestException("La imagen no puede pesar más de 30 MB");
    }

    let procesada: Buffer;
    try {
      procesada = await sharp(archivo.buffer)
        .rotate()
        .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
    } catch {
      throw new BadRequestException("No pudimos leer la imagen. ¿Está dañada?");
    }

    await fs.mkdir(CARPETA_SUBIDAS, { recursive: true });
    const nombre = `${serviceId}-${crypto.randomBytes(6).toString("hex")}.webp`;
    await fs.writeFile(path.join(CARPETA_SUBIDAS, nombre), procesada);
    return `/uploads/${nombre}`;
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
  /** Fotos del carrusel, en el orden en que se subieron. */
  images: {
    select: { id: true, url: true, imageFocalX: true, imageFocalY: true, imageScale: true },
    orderBy: { sortOrder: "asc" },
  },
} as const;
