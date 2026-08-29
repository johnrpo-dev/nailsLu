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
   * 100 muestra la foto completa; al subir se acerca hasta llenar el marco.
   * El minimo es 100 porque por debajo la imagen se despegaria de los bordes
   * y dejaria de recortarla la esquina redondeada.
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(100)
  @Max(250)
  imageScale?: number;
}
