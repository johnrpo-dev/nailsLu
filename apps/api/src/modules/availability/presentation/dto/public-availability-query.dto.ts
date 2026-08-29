import { IsDateString, IsIn, IsInt, IsOptional, IsString, Min } from "class-validator";
import { Type } from "class-transformer";
import { ServiceLocation } from "../../../../common/enums";

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

  /**
   * Modalidad de la cita que se quiere agendar.
   *
   * Cambia las franjas: a domicilio cada cita ocupa tambien el traslado, asi
   * que hay horas que caben para el spa y no para ir a casa de la clienta. Es
   * opcional y sin ella se calcula como si fuera en el spa, que es el caso
   * mas permisivo; reservar vuelve a comprobarlo con la modalidad real, asi
   * que una consulta sin este dato no puede colar una cita imposible.
   */
  @IsOptional()
  @IsIn([ServiceLocation.SPA, ServiceLocation.DOMICILIO])
  serviceLocation?: string;
}
