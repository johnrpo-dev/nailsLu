import {
  ArrayMinSize,
  Equals,
  IsArray,
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from "class-validator";

export class CreatePublicBookingDto {
  @IsString()
  @Length(2, 80)
  clientName!: string;

  @IsString()
  @Length(7, 25)
  phone!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  serviceIds!: string[];

  @IsDateString()
  date!: string;

  @IsString()
  startTime!: string;

  @IsOptional()
  @IsString()
  staffId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsString()
  idempotencyKey!: string;

  /**
   * Autorizacion de tratamiento de datos (Ley 1581 de 2012). Debe llegar en
   * true: la ley exige consentimiento expreso, asi que se valida en el
   * servidor y no solo en el formulario.
   */
  @IsBoolean()
  @Equals(true, { message: "Debes autorizar el tratamiento de tus datos para reservar" })
  dataConsent!: boolean;

  @IsOptional()
  @IsString()
  website?: string;
}
