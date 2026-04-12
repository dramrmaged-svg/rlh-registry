import {
  ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';

export class ApiException extends HttpException {
  constructor(
    status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super({ code, message, details }, status);
  }
}

interface ErrorBody {
  statusCode: number;
  error: string;
  code: string;
  message: string;
  details?: unknown;
  requestId?: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const requestId = response.getHeader('X-Request-Id') as string | undefined;
    const body = this.buildErrorBody(exception, requestId);
    if (body.statusCode >= 500) {
      this.logger.error(`[${requestId ?? 'unknown'}] ${body.code}: ${body.message}`,
        exception instanceof Error ? exception.stack : undefined);
    }
    response.status(body.statusCode).json(body);
  }

  private buildErrorBody(exception: unknown, requestId?: string): ErrorBody {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'object' && res !== null && 'code' in res) {
        const r = res as { code: string; message: string; details?: unknown };
        return { statusCode: status, error: this.statusText(status), code: r.code, message: r.message, details: r.details, requestId };
      }
      if (typeof res === 'object' && res !== null && 'message' in res) {
        const r = res as { message: string | string[] };
        return { statusCode: status, error: this.statusText(status), code: 'VALIDATION_ERROR',
          message: Array.isArray(r.message) ? r.message.join('; ') : r.message, requestId };
      }
      return { statusCode: status, error: this.statusText(status), code: 'HTTP_ERROR', message: String(res), requestId };
    }
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.handlePrismaError(exception, requestId);
    }
    if (exception instanceof Prisma.PrismaClientValidationError) {
      return { statusCode: HttpStatus.BAD_REQUEST, error: 'Bad Request', code: 'VALIDATION_ERROR', message: 'Database validation error', requestId };
    }
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR, error: 'Internal Server Error', code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred'
        : exception instanceof Error ? exception.message : String(exception),
      requestId,
    };
  }

  private handlePrismaError(error: Prisma.PrismaClientKnownRequestError, requestId?: string): ErrorBody {
    switch (error.code) {
      case 'P2002': {
        const target = error.meta?.['target'];
        const targetStr = Array.isArray(target) ? target.join(',') : String(target ?? '');
        let code = 'CONFLICT';
        let message = 'A conflicting record already exists';
        if (targetStr.includes('email')) { code = 'DUPLICATE_EMAIL'; message = 'A user with this email address already exists'; }
        else if (targetStr.includes('patientId') && targetStr.includes('mdtSessionId')) { code = 'DUPLICATE_MDT_RECORD'; message = 'An MDT record already exists for this patient and session'; }
        else if (targetStr.includes('nhs_number') || targetStr.includes('patient_identifiers_nhs')) { code = 'DUPLICATE_IDENTIFIER'; message = 'This identifier is already registered to another patient'; }
        return { statusCode: HttpStatus.CONFLICT, error: 'Conflict', code, message, details: { target: targetStr }, requestId };
      }
      case 'P2025':
        return { statusCode: HttpStatus.NOT_FOUND, error: 'Not Found', code: 'NOT_FOUND', message: 'Record not found', requestId };
      case 'P2003':
        return { statusCode: HttpStatus.UNPROCESSABLE_ENTITY, error: 'Unprocessable Entity', code: 'FOREIGN_KEY_VIOLATION',
          message: 'Related record does not exist', details: { field: error.meta?.['field_name'] }, requestId };
      default:
        return { statusCode: HttpStatus.INTERNAL_SERVER_ERROR, error: 'Internal Server Error', code: 'DATABASE_ERROR', message: 'A database error occurred', requestId };
    }
  }

  private statusText(status: number): string {
    const map: Record<number, string> = { 400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden',
      404: 'Not Found', 409: 'Conflict', 422: 'Unprocessable Entity', 429: 'Too Many Requests', 500: 'Internal Server Error' };
    return map[status] ?? 'Error';
  }
}
