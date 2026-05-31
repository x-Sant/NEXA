import { IsString, IsNotEmpty } from 'class-validator';

export class AiQueryDto {
  @IsString()
  @IsNotEmpty()
  question!: string;
}
