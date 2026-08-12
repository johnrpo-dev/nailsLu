import { Module } from "@nestjs/common";
import { ServicesController } from "./presentation/services.controller";
import { ServicesService } from "./application/services.service";

@Module({
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}
