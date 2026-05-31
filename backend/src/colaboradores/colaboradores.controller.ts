import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ColaboradoresService } from './colaboradores.service';
import { CreateColaboradoreDto } from './dto/create-colaboradore.dto';
import { UpdateColaboradoreDto } from './dto/update-colaboradore.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/user-role.enum';

@Controller('colaboradores')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ColaboradoresController {
  constructor(private readonly colaboradoresService: ColaboradoresService) {}

  @Post()
  @Roles(Role.NIVEL_3)
  create(@Body() createColaboradoreDto: CreateColaboradoreDto) {
    return this.colaboradoresService.create(createColaboradoreDto);
  }

  @Get()
  @Roles(Role.NIVEL_3, Role.PROFESSOR, Role.NIVEL_2, Role.NIVEL_1)
  findAll(@Query() query: PaginationQueryDto) {
    return this.colaboradoresService.findAll(query.page, query.limit);
  }

  @Get(':id')
  @Roles(Role.NIVEL_3, Role.NIVEL_2, Role.NIVEL_1, Role.PROFESSOR)
  findOne(@Param('id') id: string) {
    return this.colaboradoresService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.NIVEL_3)
  update(
    @Param('id') id: string,
    @Body() updateColaboradoreDto: UpdateColaboradoreDto,
  ) {
    return this.colaboradoresService.update(id, updateColaboradoreDto);
  }

  @Delete(':id')
  @Roles(Role.NIVEL_3)
  remove(@Param('id') id: string) {
    return this.colaboradoresService.remove(id);
  }
}
