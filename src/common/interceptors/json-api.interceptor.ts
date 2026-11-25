import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Wraps controller responses in a consistent JSON:API 1.1 style envelope.
 */
@Injectable()
export class JsonApiInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();

    return next.handle().pipe(
      map((payload) => {
        if (payload && typeof payload === 'object' && 'jsonapi' in payload) {
          return payload;
        }

        if (payload && typeof payload === 'object' && 'data' in payload && 'meta' in payload) {
          return {
            jsonapi: { version: '1.1' },
            data: payload.data,
            meta: {
              ...payload.meta,
              timestamp: new Date().toISOString(),
            },
            links: { self: req.originalUrl },
          };
        }

        return {
          jsonapi: { version: '1.1' },
          data: payload ?? null,
          meta: {
            timestamp: new Date().toISOString(),
          },
          links: { self: req.originalUrl },
        };
      }),
    );
  }
}
