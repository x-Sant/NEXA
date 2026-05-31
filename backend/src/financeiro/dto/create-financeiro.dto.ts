import {
  IsString,
  IsNumber,
  IsIn,
  IsOptional,
  IsDateString,
  Min,
} from 'class-validator';

export class CreateFinanceiroDto {
  @IsIn(['RECEIVABLE', 'PAYABLE'])
  type!: 'RECEIVABLE' | 'PAYABLE';

  @IsString()
  description!: string;

  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsDateString()
  dueDate!: string;

  @IsIn(['PENDING', 'PAID', 'OVERDUE', 'CANCELLED'])
  status!: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';

  @IsString()
  category!: string;

  @IsOptional()
  @IsString()
  projectId?: string;
}
