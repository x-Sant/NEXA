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
import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/user-role.enum';

@Controller('clientes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Post()
  @Roles(Role.NIVEL_3)
  create(@Body() createClienteDto: CreateClienteDto) {
    return this.clientesService.create(createClienteDto);
  }

  @Get()
  @Roles(Role.NIVEL_3, Role.NIVEL_2, Role.PROFESSOR)
  findAll(@Query() query: PaginationQueryDto) {
    return this.clientesService.findAll(query.page, query.limit);
  }

  @Get(':id')
  @Roles(Role.NIVEL_3, Role.NIVEL_2, Role.PROFESSOR)
  findOne(@Param('id') id: string) {
    return this.clientesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.NIVEL_3)
  update(@Param('id') id: string, @Body() updateClienteDto: UpdateClienteDto) {
    return this.clientesService.update(id, updateClienteDto);
  }

  @Delete(':id')
  @Roles(Role.NIVEL_3)
  remove(@Param('id') id: string) {
    return this.clientesService.remove(id);
  }
}
