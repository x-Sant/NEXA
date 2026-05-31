import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { databaseContextStorage } from './database-context';

@Injectable()
export class DatabaseContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const type = context.getType();
    if (type !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; // Decodificado e injetado pelo JwtAuthGuard

    const userId = user?.id || null;
    const userRole = user?.role || null;

    return new Observable((subscriber) => {
      databaseContextStorage.run({ userId, userRole }, () => {
        next.handle().subscribe({
          next: (val) => subscriber.next(val),
          error: (err) => subscriber.error(err),
          complete: () => subscriber.complete(),
        });
      });
    });
  }
}
