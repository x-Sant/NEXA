import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaService } from './prisma.service';
import { DatabaseContextInterceptor } from './database-context.interceptor';

@Global()
@Module({
  providers: [
    PrismaService,
    {
      provide: APP_INTERCEPTOR,
      useClass: DatabaseContextInterceptor,
    },
  ],
  exports: [PrismaService],
})
export class DatabaseModule {}
