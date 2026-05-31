import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('session')
export class SessionController {
  @Get()
  @UseGuards(JwtAuthGuard)
  getSession(@Request() req: any) {
    return {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
    };
  }
}
