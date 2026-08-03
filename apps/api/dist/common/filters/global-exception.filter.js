"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var GlobalExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalExceptionFilter = exports.ApiException = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
class ApiException extends common_1.HttpException {
    code;
    details;
    constructor(status, code, message, details) {
        super({ code, message, details }, status);
        this.code = code;
        this.details = details;
    }
}
exports.ApiException = ApiException;
let GlobalExceptionFilter = GlobalExceptionFilter_1 = class GlobalExceptionFilter {
    logger = new common_1.Logger(GlobalExceptionFilter_1.name);
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const requestId = response.getHeader('X-Request-Id');
        const body = this.buildErrorBody(exception, requestId);
        if (body.statusCode >= 500) {
            this.logger.error(`[${requestId ?? 'unknown'}] ${body.code}: ${body.message}`, exception instanceof Error ? exception.stack : undefined);
        }
        response.status(body.statusCode).json(body);
    }
    buildErrorBody(exception, requestId) {
        if (exception instanceof common_1.HttpException) {
            const status = exception.getStatus();
            const res = exception.getResponse();
            if (typeof res === 'object' && res !== null && 'code' in res) {
                const r = res;
                return { statusCode: status, error: this.statusText(status), code: r.code, message: r.message, details: r.details, requestId };
            }
            if (typeof res === 'object' && res !== null && 'message' in res) {
                const r = res;
                return { statusCode: status, error: this.statusText(status), code: 'VALIDATION_ERROR',
                    message: Array.isArray(r.message) ? r.message.join('; ') : r.message, requestId };
            }
            return { statusCode: status, error: this.statusText(status), code: 'HTTP_ERROR', message: String(res), requestId };
        }
        if (exception instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            return this.handlePrismaError(exception, requestId);
        }
        if (exception instanceof client_1.Prisma.PrismaClientValidationError) {
            return { statusCode: common_1.HttpStatus.BAD_REQUEST, error: 'Bad Request', code: 'VALIDATION_ERROR', message: 'Database validation error', requestId };
        }
        return {
            statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR, error: 'Internal Server Error', code: 'INTERNAL_ERROR',
            message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred'
                : exception instanceof Error ? exception.message : String(exception),
            requestId,
        };
    }
    handlePrismaError(error, requestId) {
        switch (error.code) {
            case 'P2002': {
                const target = error.meta?.['target'];
                const targetStr = Array.isArray(target) ? target.join(',') : String(target ?? '');
                let code = 'CONFLICT';
                let message = 'A conflicting record already exists';
                if (targetStr.includes('email')) {
                    code = 'DUPLICATE_EMAIL';
                    message = 'A user with this email address already exists';
                }
                else if (targetStr.includes('episodeId') && targetStr.includes('mdtSessionId')) {
                    code = 'DUPLICATE_MDT_RECORD';
                    message = 'An MDT record already exists for this episode and session';
                }
                else if (targetStr.includes('patientId') && targetStr.includes('episodeNumber')) {
                    code = 'DUPLICATE_EPISODE_NUMBER';
                    message = 'An episode with this number already exists for this patient';
                }
                else if (targetStr.includes('nhs_number') || targetStr.includes('patient_identifiers_nhs')) {
                    code = 'DUPLICATE_IDENTIFIER';
                    message = 'This identifier is already registered to another patient';
                }
                return { statusCode: common_1.HttpStatus.CONFLICT, error: 'Conflict', code, message, details: { target: targetStr }, requestId };
            }
            case 'P2025':
                return { statusCode: common_1.HttpStatus.NOT_FOUND, error: 'Not Found', code: 'NOT_FOUND', message: 'Record not found', requestId };
            case 'P2003':
                return { statusCode: common_1.HttpStatus.UNPROCESSABLE_ENTITY, error: 'Unprocessable Entity', code: 'FOREIGN_KEY_VIOLATION',
                    message: 'Related record does not exist', details: { field: error.meta?.['field_name'] }, requestId };
            default:
                return { statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR, error: 'Internal Server Error', code: 'DATABASE_ERROR', message: 'A database error occurred', requestId };
        }
    }
    statusText(status) {
        const map = { 400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden',
            404: 'Not Found', 409: 'Conflict', 422: 'Unprocessable Entity', 429: 'Too Many Requests', 500: 'Internal Server Error' };
        return map[status] ?? 'Error';
    }
};
exports.GlobalExceptionFilter = GlobalExceptionFilter;
exports.GlobalExceptionFilter = GlobalExceptionFilter = GlobalExceptionFilter_1 = __decorate([
    (0, common_1.Catch)()
], GlobalExceptionFilter);
