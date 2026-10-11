import { IsDateString, IsIn, IsOptional, Matches } from "class-validator";
import { FECHA_ISO } from "../../../../common/fechas";

export class ListBookingsQueryDto {
  /**
   * `active` son las reservas que aun ocupan agenda (pendientes y confirmadas)
   * y es lo que el panel muestra por defecto. `all` sirve para consultar
   * historico sin tener que entrar a la base.
   */
  @IsOptional()
  @IsIn(["active", "all", "today"])
  scope?: "active" | "all" | "today";

  @IsOptional()
  @IsDateString()
  @Matches(FECHA_ISO, { message: "date debe tener formato YYYY-MM-DD" })
  date?: string;

  /**
   * Rango de fechas, ambos extremos incluidos. Lo usa el calendario del panel
   * para pedir de una vez las seis semanas que muestra un mes.
   */
  @IsOptional()
  @IsDateString()
  @Matches(FECHA_ISO, { message: "from debe tener formato YYYY-MM-DD" })
  from?: string;

  @IsOptional()
  @IsDateString()
  @Matches(FECHA_ISO, { message: "to debe tener formato YYYY-MM-DD" })
  to?: string;
}
