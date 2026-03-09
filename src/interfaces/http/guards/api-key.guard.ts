import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ApiKeyRepository } from '@domain/repositories/api-key.repository';
import { TOKENS } from '@shared/constants/tokens';

@Injectable()
export class ApiKeyGuard implements CanActivate {
    constructor(
        @Inject(TOKENS.API_KEY_REPOSITORY) private readonly apiKeyRepo: ApiKeyRepository,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const apiKeyHeader = request.headers['x-api-key'];

        if (!apiKeyHeader || typeof apiKeyHeader !== 'string') {
            throw new UnauthorizedException('API Key is missing');
        }

        // Format: fy_abc123... (8 chars prefix + secret)
        if (!apiKeyHeader.startsWith('fy_') || apiKeyHeader.length < 20) {
            throw new UnauthorizedException('Invalid API Key format');
        }

        const prefix = apiKeyHeader.substring(0, 8);
        const apiKey = await this.apiKeyRepo.findByPrefix(prefix);

        if (!apiKey || !apiKey.isActive) {
            throw new UnauthorizedException('Invalid or inactive API Key');
        }

        const isValid = apiKey.verifyKey(apiKeyHeader);
        if (!isValid) {
            throw new UnauthorizedException('Invalid API Key');
        }

        // Update last used
        apiKey.updateLastUsed();
        await this.apiKeyRepo.update(apiKey);

        // Attach company context to request
        request['apiKey'] = {
            id: apiKey.id,
            companyId: apiKey.companyId,
            permissions: apiKey.permissions,
        };

        // For compatibility with some controllers that use user.companyId
        request['user'] = {
            companyId: apiKey.companyId,
            isMachine: true,
        };

        return true;
    }
}
