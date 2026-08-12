import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { PrismaService } from "../../../prisma/prisma.service";
import { AvailabilityService } from "../application/availability.service";
import { CreateAvailabilityBlockDto } from "./dto/create-availability-block.dto";
import { PublicAvailabilityQueryDto } from "./dto/public-availability-query.dto";

@Controller()
export class AvailabilityController {
  constructor(
    private readonly availability: AvailabilityService,
    private readonly prisma: PrismaService,
  ) {}

  @Get("public/availability")
  listPublic(@Query() query: PublicAvailabilityQueryDto) {
    return this.availability.listSlots(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get("admin/availability")
  listAdmin(@Query() query: PublicAvailabilityQueryDto) {
    return this.availability.listSlots(query);
  }

  @UseGuards(JwtAuthGuard)
  @Post("admin/availability/blocks")
  createBlock(@Body() dto: CreateAvailabilityBlockDto) {
    return this.prisma.availabilityBlock.create({
      data: {
        staffId: dto.staffId,
        date: new Date(`${dto.date}T00:00:00.000Z`),
        startTime: dto.startTime,
        endTime: dto.endTime,
        type: dto.type,
        reason: dto.reason,
      },
    });
  }

  @UseGuards(JwtAuthGuard)
  @Delete("admin/availability/blocks/:id")
  deleteBlock(@Param("id") id: string) {
    return this.prisma.availabilityBlock.delete({ where: { id } });
  }
}
