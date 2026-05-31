import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FinanceiroService } from './financeiro.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/user-role.enum';
import { CreateFinanceiroDto } from './dto/create-financeiro.dto';
import { UpdateFinanceiroDto } from './dto/update-financeiro.dto';

@Controller('financeiro')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FinanceiroController {
  constructor(private readonly financeiroService: FinanceiroService) {}

  @Post()
  @Roles(Role.NIVEL_3)
  create(@Body() createFinanceiroDto: CreateFinanceiroDto) {
    return this.financeiroService.create(createFinanceiroDto);
  }

  @Get('stats')
  @Roles(Role.NIVEL_3)
  getStats() {
    return this.financeiroService.getStats();
  }

  @Get('rentabilidade/:userId')
  @Roles(Role.NIVEL_3, Role.PROFESSOR, Role.NIVEL_2, Role.NIVEL_1)
  getUserProfitability(@Param('userId') userId: string) {
    return this.financeiroService.getUserProfitability(userId);
  }

  @Get()
  @Roles(Role.NIVEL_3)
  findAll(
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('projectId') projectId?: string,
    @Query('month') month?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.financeiroService.findAll({ type, status, projectId, month, page: page ? Number(page) : 1, limit: limit ? Number(limit) : 100 });
  }

  @Get(':id')
  @Roles(Role.NIVEL_3)
  findOne(@Param('id') id: string) {
    return this.financeiroService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.NIVEL_3)
  update(
    @Param('id') id: string,
    @Body() updateFinanceiroDto: UpdateFinanceiroDto,
  ) {
    return this.financeiroService.update(id, updateFinanceiroDto);
  }

  @Delete(':id')
  @Roles(Role.NIVEL_3)
  remove(@Param('id') id: string) {
    return this.financeiroService.remove(id);
  }
}
