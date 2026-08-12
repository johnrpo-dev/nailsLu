import { IsDateString, IsInt, IsOptional, IsString, Min } from "class-validator";
import { Type } from "class-transformer";

export class PublicAvailabilityQueryDto {
  @IsDateString()
  date!: string;

  @Type(() => Number)
  @IsInt()
  @Min(5)
  durationMinutes!: number;

  @IsOptional()
  @IsString()
  staffId?: string;
}
