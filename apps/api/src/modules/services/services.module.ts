import { Module } from "@nestjs/common";
import { ServicesController } from "./presentation/services.controller";
import { ServiceImagesService } from "./application/service-images.service";
import { ServicesService } from "./application/services.service";

@Module({
  controllers: [ServicesController],
  providers: [ServicesService, ServiceImagesService],
  exports: [ServicesService],
})
export class ServicesModule {}
