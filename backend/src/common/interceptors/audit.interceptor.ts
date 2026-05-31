import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import * as fs from 'fs';
import * as path from 'path';
import { Request } from 'express';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);
  private readonly auditLogPath = path.join(process.cwd(), 'audit.log');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: { id: string; role: string } }>();
    const { method, url, ip } = request;

    // Apenas logamos requisições que alteram estado (POST, PUT, PATCH, DELETE)
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      // Extrai usuário logado se existir
      const user = request.user
        ? `User:[${request.user.id}|${request.user.role}]`
        : 'User:[Anonymous]';

      const now = new Date();
      const logMessage = `[${now.toISOString()}] ${ip} - ${method} ${url} - ${user}\n`;

      // Log to console for dev
      this.logger.log(`Audit: ${method} ${url} by ${user}`);

      // Grava no arquivo de log forense de forma não bloqueante
      fs.promises
        .appendFile(this.auditLogPath, logMessage)
        .catch((err: unknown) => {
          const errorMsg = err instanceof Error ? err.message : String(err);
          this.logger.error(`Failed to write to audit log: ${errorMsg}`);
        });
    }

    return next.handle().pipe(
      tap(() => {
        // Optional: log successful completions
      }),
    );
  }
}
