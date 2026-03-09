import { Inject, Injectable } from '@nestjs/common';
import { ApiKeyRepository } from '@domain/repositories/api-key.repository';
import { ApiKey, ApiKeyPermission } from '@domain/entities/api-key.entity';
import { TOKENS } from '@shared/constants/tokens';
import { NotFoundException } from '@shared/exceptions/not-found.exception';

export interface CreateApiKeyDto {
    name: string;
    permissions?: ApiKeyPermission[];
}

export interface ApiKeyResponseDto {
    id: string;
    name: string;
    secretPrefix: string;
    permissions: ApiKeyPermission[];
    isActive: boolean;
    lastUsedAt?: Date;
    createdAt: Date;
    rawSecret?: string; // Only returned once on creation
}

@Injectable()
export class CreateApiKeyUseCase {
    constructor(
        @Inject(TOKENS.API_KEY_REPOSITORY) private readonly repo: ApiKeyRepository,
    ) { }

    async execute(companyId: string, dto: CreateApiKeyDto): Promise<ApiKeyResponseDto> {
        const { apiKey, rawSecret } = ApiKey.create({
            companyId,
            name: dto.name,
            permissions: dto.permissions,
        });

        await this.repo.create(apiKey);

        return {
            id: apiKey.id,
            name: apiKey.name,
            secretPrefix: apiKey.secretPrefix,
            permissions: apiKey.permissions,
            isActive: apiKey.isActive,
            createdAt: apiKey.createdAt,
            rawSecret,
        };
    }
}

@Injectable()
export class GetApiKeysUseCase {
    constructor(
        @Inject(TOKENS.API_KEY_REPOSITORY) private readonly repo: ApiKeyRepository,
    ) { }

    async execute(companyId: string): Promise<ApiKeyResponseDto[]> {
        const keys = await this.repo.findAll(companyId);
        return keys.map(k => ({
            id: k.id,
            name: k.name,
            secretPrefix: k.secretPrefix,
            permissions: k.permissions,
            isActive: k.isActive,
            lastUsedAt: k.lastUsedAt,
            createdAt: k.createdAt,
        }));
    }
}

@Injectable()
export class RevokeApiKeyUseCase {
    constructor(
        @Inject(TOKENS.API_KEY_REPOSITORY) private readonly repo: ApiKeyRepository,
    ) { }

    async execute(id: string, companyId: string): Promise<void> {
        const apiKey = await this.repo.findById(id, companyId);
        if (!apiKey) throw new NotFoundException('ApiKey');

        await this.repo.delete(id, companyId);
    }
}
