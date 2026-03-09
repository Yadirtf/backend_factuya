import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ApiKeyGuard } from './api-key.guard';

@Injectable()
export class MainAuthGuard implements CanActivate {
    constructor(
        private readonly jwtGuard: JwtAuthGuard,
        private readonly apiKeyGuard: ApiKeyGuard,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();

        // 1. Try API Key first (common for external systems)
        if (request.headers['x-api-key']) {
            try {
                return await this.apiKeyGuard.canActivate(context);
            } catch (error) {
                // If API Key is present but invalid, reject
                throw error;
            }
        }

        // 2. Try JWT
        try {
            return await this.jwtGuard.canActivate(context) as boolean;
        } catch (error) {
            throw new UnauthorizedException('Authentication required (JWT or API Key)');
        }
    }
}
