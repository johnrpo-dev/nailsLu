import { IsDateString, IsOptional } from "class-validator";

export class ListBlocksQueryDto {
  /** Por defecto, desde hoy. Los bloqueos pasados ya no afectan nada. */
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
