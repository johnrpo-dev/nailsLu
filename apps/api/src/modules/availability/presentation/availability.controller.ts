import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { AvailabilityService } from "../application/availability.service";
import { CreateAvailabilityBlockDto } from "./dto/create-availability-block.dto";
import { ListBlocksQueryDto } from "./dto/list-blocks-query.dto";
import { PublicAvailabilityQueryDto } from "./dto/public-availability-query.dto";
import { ReplaceBusinessHoursDto } from "./dto/replace-business-hours.dto";

@Controller()
export class AvailabilityController {
  constructor(private readonly availability: AvailabilityService) {}

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
  @Get("admin/availability/holidays")
  listHolidays() {
    return this.availability.proximosFestivos();
  }

  @UseGuards(JwtAuthGuard)
  @Get("admin/availability/blocks")
  listBlocks(@Query() query: ListBlocksQueryDto) {
    return this.availability.listBlocks(query);
  }

  @UseGuards(JwtAuthGuard)
  @Post("admin/availability/blocks")
  createBlock(@Body() dto: CreateAvailabilityBlockDto) {
    return this.availability.createBlock(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete("admin/availability/blocks/:id")
  deleteBlock(@Param("id") id: string) {
    return this.availability.deleteBlock(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get("admin/business-hours")
  listBusinessHours() {
    return this.availability.listBusinessHours();
  }

  @UseGuards(JwtAuthGuard)
  @Put("admin/business-hours")
  replaceBusinessHours(@Body() dto: ReplaceBusinessHoursDto) {
    return this.availability.replaceBusinessHours(dto.hours);
  }
}
