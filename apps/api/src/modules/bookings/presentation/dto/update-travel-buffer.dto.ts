import { IsInt, Max, Min } from "class-validator";
import { Type } from "class-transformer";

export class UpdateTravelBufferDto {
  /**
   * Minutos de traslado, a cada lado de la cita.
   *
   * Cero es valido: una clienta que vive en el mismo edificio no obliga a
   * reservar ningun hueco. El techo de tres horas es un limite de cordura, no
   * una regla del negocio; sin el, un error de tecleo podria bloquear el dia
   * entero sin que nada lo impidiera.
   */
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(180, { message: "El traslado no puede pasar de 3 horas" })
  minutes!: number;
}
