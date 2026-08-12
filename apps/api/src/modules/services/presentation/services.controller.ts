import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { ServicesService } from "../application/services.service";
import { CreateServiceDto } from "./dto/create-service.dto";
import { UpdateServiceDto } from "./dto/update-service.dto";

@Controller()
export class ServicesController {
  constructor(private readonly services: ServicesService) {}

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

  @UseGuards(JwtAuthGuard)
  @Delete("admin/services/:id")
  remove(@Param("id") id: string) {
    return this.services.remove(id);
  }
}
