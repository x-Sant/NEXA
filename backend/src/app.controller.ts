import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './database/prisma.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { Roles } from './auth/decorators/roles.decorator';
import { Role } from './auth/enums/user-role.enum';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('sistema/storage')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.NIVEL_3)
  async getStorageStats() {
    // 1. Get database size in bytes
    const dbSizeResult: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT pg_database_size(current_database()) as size`
    );
    const databaseSizeBytes = Number(dbSizeResult[0]?.size || 0);

    // 2. Get bucket size (sum of file size in demand_files)
    const bucketSizeAggregate = await this.prisma.demand_files.aggregate({
      _sum: {
        file_size_bytes: true
      }
    });
    const bucketSizeBytes = Number(bucketSizeAggregate._sum.file_size_bytes || 0);

    return {
      databaseSizeBytes,
      bucketSizeBytes,
    };
  }
}
