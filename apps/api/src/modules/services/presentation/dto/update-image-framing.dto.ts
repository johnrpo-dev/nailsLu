import { IsInt, Max, Min } from "class-validator";
import { Type } from "class-transformer";

/** Encuadre de una foto del carrusel. Mismos limites que la portada. */
export class UpdateImageFramingDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  imageFocalX!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  imageFocalY!: number;

  /**
   * Nunca por debajo de 100: con `object-fit: cover`, una escala menor
   * despegaria la foto del marco y reapareceria el hueco que se buscaba evitar.
   */
  @Type(() => Number)
  @IsInt()
  @Min(100)
  @Max(300)
  imageScale!: number;
}
