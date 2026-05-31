import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
  ForbiddenException,
  Query,
} from '@nestjs/common';
import { ProjetosService } from './projetos.service';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/user-role.enum';
import {
  CreateProjetoDto,
  CreateDemandaDto,
  AddMemberDto,
  UpdateStatusDto,
  CreateContractDto,
} from './dto/projetos.dto';

interface RequestWithUser extends Request {
  user: { id: string; role: Role; email: string };
}

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjetosController {
  constructor(private readonly projetosService: ProjetosService) {}

  @Post('projetos')
  @Roles(Role.NIVEL_3)
  create(@Body() createProjectDto: CreateProjetoDto) {
    return this.projetosService.create(createProjectDto);
  }

  @Get('projetos')
  @Roles(Role.NIVEL_3, Role.PROFESSOR, Role.NIVEL_2, Role.NIVEL_1, Role.CLIENTE)
  findAll(@Request() req: RequestWithUser, @Query() query: PaginationQueryDto) {
    return this.projetosService.findAll(req.user.id, req.user.role, query.page, query.limit);
  }

  @Get('projetos-dump')
  @Roles(Role.NIVEL_3, Role.PROFESSOR, Role.NIVEL_2, Role.NIVEL_1, Role.CLIENTE)
  dumpData(@Request() req: RequestWithUser) {
    return this.projetosService.getDump(req.user.id, req.user.role);
  }

  @Get('projetos/:id')
  @Roles(Role.NIVEL_3, Role.PROFESSOR, Role.NIVEL_2, Role.NIVEL_1)
  async findOne(@Param('id') id: string, @Request() req: RequestWithUser) {
    const project = await this.projetosService.findOne(id);

    // Security Check: NIVEL_1 estagiarios can only view details of their own projects
    if (req.user.role === Role.NIVEL_1) {
      const isMember = project.members.some(
        (m: { userId: string }) => m.userId === req.user.id,
      );
      if (!isMember) {
        throw new ForbiddenException(
          'Você não tem permissão para visualizar este projeto.',
        );
      }
    }

    return project;
  }

  @Post('projetos/:id/membros')
  @Roles(Role.NIVEL_3, Role.NIVEL_2)
  addMember(@Param('id') id: string, @Body() memberDto: AddMemberDto) {
    return this.projetosService.addMember(id, memberDto);
  }

  @Delete('projetos/:id/membros/:userId')
  @Roles(Role.NIVEL_3, Role.NIVEL_2)
  removeMember(@Param('id') id: string, @Param('userId') userId: string) {
    return this.projetosService.removeMember(id, userId);
  }

  @Post('projetos/:id/demandas')
  @Roles(Role.NIVEL_3)
  createDemand(@Param('id') id: string, @Body() demandDto: CreateDemandaDto) {
    return this.projetosService.createDemand(id, demandDto);
  }

  @Patch('demandas/:id')
  @Roles(Role.NIVEL_3, Role.NIVEL_2, Role.PROFESSOR)
  updateDemandStatus(@Param('id') id: string, @Body() body: UpdateStatusDto) {
    return this.projetosService.updateDemandStatus(id, body.status);
  }

  @Post('projetos/:id/arquivos')
  @Roles(Role.NIVEL_3, Role.NIVEL_2, Role.NIVEL_1, Role.CLIENTE)
  addProjectFiles(@Param('id') id: string, @Body() files: any[]) {
    return this.projetosService.addProjectFiles(id, files);
  }

  @Post('projetos/:id/contratos')
  @Roles(Role.NIVEL_3)
  addContract(@Param('id') id: string, @Body() contractDto: CreateContractDto) {
    return this.projetosService.addContract(id, contractDto);
  }

  @Patch('projetos/:id/contratos/:contractId/assinar')
  @Roles(Role.CLIENTE, Role.NIVEL_3)
  signContract(
    @Param('id') id: string,
    @Param('contractId') contractId: string,
    @Request() req: RequestWithUser & { ip: string }
  ) {
    return this.projetosService.signContract(id, contractId, req.ip);
  }

  @Post('projetos/:id/entregas')
  @Roles(Role.NIVEL_1, Role.NIVEL_2, Role.NIVEL_3)
  addDelivery(@Param('id') id: string, @Body() deliveryData: any) {
    return this.projetosService.addDelivery(id, deliveryData);
  }

  @Patch('projetos/:id/entregas/:deliveryId/validar')
  @Roles(Role.NIVEL_3)
  validateDelivery(
    @Param('id') id: string,
    @Param('deliveryId') deliveryId: string,
    @Body() validateData: any
  ) {
    return this.projetosService.validateDelivery(id, deliveryId, validateData);
  }

  @Delete('projetos/:id')
  @Roles(Role.NIVEL_3)
  remove(@Param('id') id: string) {
    return this.projetosService.remove(id);
  }
}
