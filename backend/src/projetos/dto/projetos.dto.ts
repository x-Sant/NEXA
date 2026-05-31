import {
  IsString,
  IsOptional,
  IsDateString,
  IsIn,
  IsNumber,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

export class CreateProjetoDto {
  @IsString()
  name!: string;

  @IsString()
  description!: string;

  @IsDateString()
  deadline!: string;

  @IsString()
  @IsOptional()
  clientId?: string;

  @IsIn(['ACTIVE', 'COMPLETED', 'PAUSED'])
  status!: 'ACTIVE' | 'COMPLETED' | 'PAUSED';
}

export class CreateDemandaDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsDateString()
  deadline!: string;
}

export class AddMemberDto {
  @IsString()
  userId!: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  productivity!: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  progress!: number;
}

export class UpdateStatusDto {
  @IsString()
  @IsIn(['PENDING', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'])
  status!: string;
}

export class CreateContractDto {
  @IsString()
  title!: string;

  @IsString()
  @MaxLength(5000)
  content!: string;
}
