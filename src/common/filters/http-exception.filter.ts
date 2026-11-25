import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * JSON:API compliant global exception filter
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let title = 'Internal Server Error';
    let detail: string | string[] = 'An unexpected error occurred';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        detail = res;
        title = HttpStatus[status] || 'Error';
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, any>;
        title = resObj.error || HttpStatus[status] || 'Error';
        detail = resObj.message || detail;
      }
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
      detail = process.env.NODE_ENV === 'production' ? 'Internal server error' : exception.message;
    }

    const errors = Array.isArray(detail)
      ? detail.map((msg) => ({
          status: String(status),
          title,
          detail: msg,
          source: { pointer: request.url },
        }))
      : [
          {
            status: String(status),
            title,
            detail,
            source: { pointer: request.url },
          },
        ];

    response.status(status).json({
      jsonapi: { version: '1.1' },
      errors,
      meta: {
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
      },
    });
  }
}
