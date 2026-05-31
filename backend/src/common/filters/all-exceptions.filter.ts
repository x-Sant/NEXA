import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Erro interno no servidor.';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.getResponse();
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        message = 'Conflito: Registro já existente com este valor único.';
      } else if (exception.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        message = 'Registro não encontrado.';
      } else if (exception.code === 'P2003') {
        status = HttpStatus.CONFLICT;
        message = 'Falha de restrição de chave estrangeira.';
      } else {
        status = HttpStatus.BAD_REQUEST;
        message = `Erro de banco de dados: ${exception.code}`;
      }
    } else if (exception instanceof Error) {
      // Log the actual error stack internally for debugging, but NEVER return it to the user
      this.logger.error(
        `Critical Unhandled Exception: ${exception.message}`,
        exception.stack,
      );
    } else {
      this.logger.error(`Unknown Exception: ${JSON.stringify(exception)}`);
    }

    // Format consistent JSON response and hide implementation details for 500s
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message:
        typeof message === 'string'
          ? message
          : (message as Record<string, unknown>)?.message || message,
    });
  }
}
