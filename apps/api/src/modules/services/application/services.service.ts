import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { CreateServiceDto } from "../presentation/dto/create-service.dto";
import { UpdateServiceDto } from "../presentation/dto/update-service.dto";

/**
 * Campos que salen del servidor. El precio queda deliberadamente fuera: la
 * tarifa se acuerda con cada clienta y no es un atributo del servicio.
 */
const CAMPOS_PUBLICOS = {
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

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  listPublic() {
    return this.prisma.service.findMany({
      where: { isActive: true },
      select: CAMPOS_PUBLICOS,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
  }

  listAdmin() {
    return this.prisma.service.findMany({
      select: CAMPOS_PUBLICOS,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
  }

  async create(dto: CreateServiceDto) {
    // Sin posicion explicita, el servicio nuevo entra al final del catalogo.
    // Con el default de 0 se colaba de primero, que no es lo que se espera.
    const sortOrder = dto.sortOrder ?? (await this.nextSortOrder());
    return this.prisma.service.create({ data: { ...dto, sortOrder }, select: CAMPOS_PUBLICOS });
  }

  private async nextSortOrder() {
    const ultimo = await this.prisma.service.findFirst({
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    return (ultimo?.sortOrder ?? 0) + 1;
  }

  async update(id: string, dto: UpdateServiceDto) {
    await this.ensureExists(id);
    return this.prisma.service.update({ where: { id }, data: dto, select: CAMPOS_PUBLICOS });
  }

  /** Borrado logico: el servicio deja de ofrecerse pero el historial sobrevive. */
  async remove(id: string) {
    await this.ensureExists(id);
    return this.prisma.service.update({
      where: { id },
      data: { isActive: false },
      select: CAMPOS_PUBLICOS,
    });
  }

  async findActiveByIds(ids: string[]) {
    const services = await this.prisma.service.findMany({
      where: { id: { in: ids }, isActive: true },
      select: CAMPOS_PUBLICOS,
    });

    if (services.length !== ids.length) {
      throw new NotFoundException("One or more services are not available");
    }

    return services;
  }

  private async ensureExists(id: string) {
    const service = await this.prisma.service.findUnique({ where: { id }, select: { id: true } });
    if (!service) {
      throw new NotFoundException("Service not found");
    }
  }
}
