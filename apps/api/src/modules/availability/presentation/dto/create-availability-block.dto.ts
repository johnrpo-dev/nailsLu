import { IsDateString, IsIn, IsOptional, IsString, Length, Matches } from "class-validator";

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

export class CreateAvailabilityBlockDto {
  @IsOptional()
  @IsString()
  staffId?: string;

  @IsDateString()
  date!: string;

  @Matches(HORA, { message: "startTime debe tener formato HH:MM" })
  startTime!: string;

  @Matches(HORA, { message: "endTime debe tener formato HH:MM" })
  endTime!: string;

  /** BLOCKED cierra una franja; AVAILABLE abre una fuera del horario base. */
  @IsIn(["AVAILABLE", "BLOCKED"])
  type!: "AVAILABLE" | "BLOCKED";

  @IsOptional()
  @IsString()
  @Length(0, 140)
  reason?: string;
}
