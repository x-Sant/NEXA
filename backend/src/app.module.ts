import { Module } from '@nestjs/common';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ColaboradoresModule } from './colaboradores/colaboradores.module';
import { FinanceiroModule } from './financeiro/financeiro.module';
import { ClientesModule } from './clientes/clientes.module';
import { AuthModule } from './auth/auth.module';
import { FilesModule } from './files/files.module';
import { AiModule } from './ai/ai.module';
import { DatabaseModule } from './database/database.module';
import { ProjetosModule } from './projetos/projetos.module';
import { TicketsModule } from './tickets/tickets.module';
import { ComentariosModule } from './comentarios/comentarios.module';
import { SocketModule } from './socket/socket.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100, // 100 requests per minute max
      },
    ]),
    DatabaseModule,
    ColaboradoresModule,
    FinanceiroModule,
    ClientesModule,
    AuthModule,
    FilesModule,
    AiModule,
    ProjetosModule,
    TicketsModule,
    ComentariosModule,
    SocketModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
