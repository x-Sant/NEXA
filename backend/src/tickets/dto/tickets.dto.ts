import { IsString, IsOptional, IsIn, MinLength, MaxLength } from 'class-validator';

export class CreateTicketDto {
  @IsString()
  subject!: string;

  @IsString()
  description!: string;

  @IsString()
  @IsOptional()
  projectId?: string;
}

export class TicketResponseDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  message!: string;
}

export class UpdateTicketStatusDto {
  @IsString()
  @IsIn(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'])
  status!: string;
}
