import {
    ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { DomainException } from '@shared/exceptions/domain.exception';
import { NotFoundException } from '@shared/exceptions/not-found.exception';
import { UnauthorizedException } from '@shared/exceptions/unauthorized.exception';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const res = exception.getResponse();
            message = typeof res === 'object' ? (res as any).message ?? message : String(res);
        } else if (exception instanceof NotFoundException) {
            status = HttpStatus.NOT_FOUND;
            message = exception.message;
        } else if (exception instanceof UnauthorizedException) {
            status = HttpStatus.UNAUTHORIZED;
            message = exception.message;
        } else if (exception instanceof DomainException) {
            status = HttpStatus.UNPROCESSABLE_ENTITY;
            message = exception.message;
        } else if (exception instanceof Error) {
            message = exception.message;
        }

        if (status >= 500) {
            this.logger.error(`[${request.method}] ${request.url} → ${status}: ${message}`, (exception as any).stack);
        } else {
            this.logger.warn(`[${request.method}] ${request.url} → ${status}: ${message}`);
        }

        response.status(status).json({
            success: false,
            statusCode: status,
            message: Array.isArray(message) ? message : [message],
            timestamp: new Date().toISOString(),
            path: request.url,
        });
    }
}
