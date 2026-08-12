import { IsBoolean, IsInt, IsOptional, IsString, Length, Max, Min } from "class-validator";

export class CreateServiceDto {
  @IsString()
  @Length(2, 80)
  name!: string;

  @IsOptional()
  @IsString()
  @Length(0, 300)
  description?: string;

  /**
   * La duracion manda: define los bloques de la agenda y el fin de la reserva.
   * El tope de 8 horas evita que un dedazo bloquee la agenda de todo un dia.
   */
  @IsInt()
  @Min(5)
  @Max(480)
  durationMinutes!: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
