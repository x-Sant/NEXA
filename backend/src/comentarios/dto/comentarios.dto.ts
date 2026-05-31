import { IsString } from 'class-validator';

export class CreateComentarioDto {
  @IsString()
  targetId!: string;

  @IsString()
  comment!: string;
}
