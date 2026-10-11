import { IsDateString, IsOptional, Matches } from "class-validator";
import { FECHA_ISO } from "../../../../common/fechas";

export class ListBlocksQueryDto {
  /** Por defecto, desde hoy. Los bloqueos pasados ya no afectan nada. */
  @IsOptional()
  @IsDateString()
  @Matches(FECHA_ISO, { message: "from debe tener formato YYYY-MM-DD" })
  from?: string;

  @IsOptional()
  @IsDateString()
  @Matches(FECHA_ISO, { message: "to debe tener formato YYYY-MM-DD" })
  to?: string;
}
