import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { ServiceImagesService } from "../application/service-images.service";
import { UpdateImageFramingDto } from "./dto/update-image-framing.dto";
import { ServicesService } from "../application/services.service";
import { CreateServiceDto } from "./dto/create-service.dto";
import { UpdateServiceDto } from "./dto/update-service.dto";

@Controller()
export class ServicesController {
  constructor(
    private readonly services: ServicesService,
    private readonly imagenes: ServiceImagesService,
  ) {}

  @Get("public/services")
  listPublic() {
    return this.services.listPublic();
  }

  @UseGuards(JwtAuthGuard)
  @Get("admin/services")
  listAdmin() {
    return this.services.listAdmin();
  }

  @UseGuards(JwtAuthGuard)
  @Post("admin/services")
  create(@Body() dto: CreateServiceDto) {
    return this.services.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch("admin/services/:id")
  update(@Param("id") id: string, @Body() dto: UpdateServiceDto) {
    return this.services.update(id, dto);
  }

  /**
   * La foto se guarda en memoria y se reprocesa antes de tocar el disco, asi
   * que nunca se escribe el archivo tal como llego.
   */
  @UseGuards(JwtAuthGuard)
  @Post("admin/services/:id/image")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 30 * 1024 * 1024 } }))
  uploadImage(@Param("id") id: string, @UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException("No llegó ninguna imagen");
    return this.imagenes.guardar(id, file);
  }

  @UseGuards(JwtAuthGuard)
  @Post("admin/services/:id/images")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 30 * 1024 * 1024 } }))
  anadirFoto(@Param("id") id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException("No llego ninguna imagen");
    return this.imagenes.anadirAlCarrusel(id, file);
  }

  @UseGuards(JwtAuthGuard)
  @Patch("admin/services/:id/images/:imageId")
  reencuadrarFoto(
    @Param("id") id: string,
    @Param("imageId") imageId: string,
    @Body() dto: UpdateImageFramingDto,
  ) {
    return this.imagenes.reencuadrar(id, imageId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete("admin/services/:id/images/:imageId")
  quitarFoto(@Param("id") id: string, @Param("imageId") imageId: string) {
    return this.imagenes.quitarDelCarrusel(id, imageId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete("admin/services/:id/image")
  removeImage(@Param("id") id: string) {
    return this.imagenes.quitar(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete("admin/services/:id")
  remove(@Param("id") id: string) {
    return this.services.remove(id);
  }
}
