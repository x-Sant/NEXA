import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Request,
  UseGuards,
  ForbiddenException,
  Query,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/user-role.enum';
import {
  CreateTicketDto,
  TicketResponseDto,
  UpdateTicketStatusDto,
} from './dto/tickets.dto';

interface RequestWithUser extends Request {
  user: { id: string; role: Role; email: string };
}

@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @Roles(Role.CLIENTE, Role.NIVEL_1, Role.NIVEL_2, Role.NIVEL_3)
  create(@Request() req: RequestWithUser, @Body() ticketDto: CreateTicketDto) {
    return this.ticketsService.create(req.user.id, ticketDto);
  }

  @Get()
  @Roles(Role.CLIENTE, Role.NIVEL_1, Role.NIVEL_2, Role.NIVEL_3, Role.PROFESSOR)
  findAll(@Request() req: RequestWithUser, @Query() query: PaginationQueryDto) {
    return this.ticketsService.findAll(req.user.id, req.user.role, query.page, query.limit);
  }

  @Get('dump')
  @Roles(Role.CLIENTE, Role.NIVEL_1, Role.NIVEL_2, Role.NIVEL_3, Role.PROFESSOR)
  dumpData() {
    return this.ticketsService.getDump();
  }

  @Get(':id')
  @Roles(Role.CLIENTE, Role.NIVEL_1, Role.NIVEL_2, Role.NIVEL_3, Role.PROFESSOR)
  async findOne(@Param('id') id: string, @Request() req: RequestWithUser) {
    const ticket = await this.ticketsService.findOne(id);

    // Security Check: Clients can only see their own tickets
    if (req.user.role === Role.CLIENTE && ticket.creatorId !== req.user.id) {
      throw new ForbiddenException(
        'Você não tem permissão para visualizar este chamado.',
      );
    }

    return ticket;
  }

  @Post(':id/respostas')
  @Roles(Role.CLIENTE, Role.NIVEL_1, Role.NIVEL_2, Role.NIVEL_3, Role.PROFESSOR)
  addResponse(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
    @Body() body: TicketResponseDto,
  ) {
    return this.ticketsService.addResponse(id, req.user.id, body.message);
  }

  @Patch(':id/status')
  @Roles(Role.NIVEL_3, Role.NIVEL_2, Role.PROFESSOR)
  updateStatus(@Param('id') id: string, @Body() body: UpdateTicketStatusDto) {
    return this.ticketsService.updateStatus(id, body.status);
  }
}
