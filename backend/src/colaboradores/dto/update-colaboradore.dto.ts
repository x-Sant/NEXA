import { PartialType } from '@nestjs/mapped-types';
import { CreateColaboradoreDto } from './create-colaboradore.dto';

export class UpdateColaboradoreDto extends PartialType(CreateColaboradoreDto) {}
