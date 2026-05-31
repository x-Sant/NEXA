import {
  IsString,
  IsEmail,
  IsBoolean,
  IsOptional,
  IsIn,
  Matches,
  MinLength,
} from 'class-validator';

export class CreateColaboradoreDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @Matches(/^([0-9]{11}|[0-9]{14})$/, { message: 'CPF deve conter 11 dígitos numéricos e CNPJ 14 dígitos numéricos' })
  cpfCnpj!: string;

  @IsIn(['NIVEL_1', 'NIVEL_2', 'NIVEL_3', 'PROFESSOR'])
  role!: 'NIVEL_1' | 'NIVEL_2' | 'NIVEL_3' | 'PROFESSOR';

  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'A senha deve ter no mínimo 8 caracteres' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/, {
    message: 'A senha deve conter no mínimo uma letra e um número',
  })
  password?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
