import { ArrayMinSize, IsArray, IsDateString, IsOptional, IsString, Length, MaxLength } from "class-validator";

export class CreatePublicBookingDto {
  @IsString()
  @Length(2, 80)
  clientName!: string;

  @IsString()
  @Length(7, 25)
  phone!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  serviceIds!: string[];

  @IsDateString()
  date!: string;

  @IsString()
  startTime!: string;

  @IsOptional()
  @IsString()
  staffId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsString()
  idempotencyKey!: string;

  @IsOptional()
  @IsString()
  website?: string;
}
