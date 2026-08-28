import { IsString, MaxLength, MinLength } from "class-validator";

export class ChangePasswordDto {
  @IsString()
  currentPassword!: string;

  /**
   * Minimo 10 caracteres. Se prefiere longitud a reglas de simbolos: una frase
   * larga es mas dificil de adivinar y mas facil de recordar que "P@ssw0rd!".
   * El tope evita cargas absurdas al hashear con bcrypt.
   */
  @IsString()
  @MinLength(10, { message: "La contraseña nueva debe tener al menos 10 caracteres" })
  @MaxLength(72, { message: "La contraseña no puede superar los 72 caracteres" })
  newPassword!: string;
}
