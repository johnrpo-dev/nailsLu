import {
  ArrayMinSize,
  Equals,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  ValidateIf,
} from "class-validator";
import { ServiceLocation } from "../../../../common/enums";

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

  /** Donde se presta el servicio. */
  @IsIn([ServiceLocation.SPA, ServiceLocation.DOMICILIO])
  serviceLocation!: string;

  /**
   * Direccion, solo a domicilio.
   *
   * `ValidateIf` la exige cuando la modalidad es DOMICILIO. El caso contrario
   * (direccion enviada para una cita en el spa) se rechaza en el servicio:
   * class-validator no encadena bien dos condiciones opuestas sobre el mismo
   * campo. La misma regla vive en el esquema compartido, para que el formulario
   * no deje enviarla y el servidor no dependa de que el formulario la cumpla.
   */
  @ValidateIf((dto: CreatePublicBookingDto) => dto.serviceLocation === ServiceLocation.DOMICILIO)
  @IsString()
  @Length(10, 200, { message: "Necesitamos la dirección para ir a domicilio" })
  address?: string;

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
