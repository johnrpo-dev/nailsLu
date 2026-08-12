import { IsDateString, IsIn, IsOptional } from "class-validator";

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
  date?: string;
}
