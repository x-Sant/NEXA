import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ComentariosService } from './comentarios.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/user-role.enum';
import { CreateComentarioDto } from './dto/comentarios.dto';

interface RequestWithUser extends Request {
  user: { id: string; role: string; email: string };
}

@Controller('comentarios')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ComentariosController {
  constructor(private readonly comentariosService: ComentariosService) {}

  @Post()
  @Roles(Role.PROFESSOR)
  create(
    @Request() req: RequestWithUser,
    @Body() commentDto: CreateComentarioDto,
  ) {
    return this.comentariosService.create(req.user.id, commentDto);
  }

  @Get('estagiario/:id')
  @Roles(Role.NIVEL_3, Role.PROFESSOR, Role.NIVEL_2, Role.NIVEL_1)
  findByEstagiario(@Param('id') id: string) {
    return this.comentariosService.findByEstagiario(id);
  }
}
