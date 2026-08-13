import { Type } from "class-transformer";
import { ArrayMaxSize, IsArray, IsBoolean, IsInt, IsOptional, Matches, Max, Min, ValidateNested } from "class-validator";

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

export class BusinessHourDto {
  /** 0 = domingo, 6 = sabado, igual que `Date.getUTCDay()`. */
  @IsInt()
  @Min(0)
  @Max(6)
  weekday!: number;

  @Matches(HORA, { message: "startTime debe tener formato HH:MM" })
  startTime!: string;

  @Matches(HORA, { message: "endTime debe tener formato HH:MM" })
  endTime!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ReplaceBusinessHoursDto {
  @IsArray()
  // Un tramo por dia deja margen para partir la jornada (manana y tarde).
  @ArrayMaxSize(21)
  @ValidateNested({ each: true })
  @Type(() => BusinessHourDto)
  hours!: BusinessHourDto[];
}
