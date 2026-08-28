import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";

/** Reencuadre de la foto. Se guarda aparte del archivo: no lo modifica. */
export class UpdateServiceImageDto {
  /** Punto focal horizontal, 0 = izquierda, 100 = derecha. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  imageFocalX?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  imageFocalY?: number;

  /**
   * 100 llena la tarjeta. Por debajo deja aire alrededor, por encima acerca.
   * El rango evita que la foto se pierda o se pixele.
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(60)
  @Max(250)
  imageScale?: number;
}
