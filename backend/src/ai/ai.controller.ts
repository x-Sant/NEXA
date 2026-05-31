import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { AiService } from './ai.service';
import { AiQueryDto } from './dto/ai-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/user-role.enum';

@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('search')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.NIVEL_3, Role.NIVEL_2, Role.NIVEL_1, Role.PROFESSOR, Role.CLIENTE)
  async search(@Body() aiQueryDto: AiQueryDto, @Request() req: any) {
    return this.aiService.search(aiQueryDto.question, req.user.id, req.user.role);
  }
}
