import { IsDateString, IsIn, IsOptional, IsString } from "class-validator";

export class CreateAvailabilityBlockDto {
  @IsOptional()
  @IsString()
  staffId?: string;

  @IsDateString()
  date!: string;

  @IsString()
  startTime!: string;

  @IsString()
  endTime!: string;

  @IsIn(["AVAILABLE", "BLOCKED"])
  type!: "AVAILABLE" | "BLOCKED";

  @IsOptional()
  @IsString()
  reason?: string;
}
