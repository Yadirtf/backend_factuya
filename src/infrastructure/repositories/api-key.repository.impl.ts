import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApiKeyRepository } from '@domain/repositories/api-key.repository';
import { ApiKey, ApiKeyPermission } from '@domain/entities/api-key.entity';
import { ApiKeyDocumentClass, ApiKeyDocument } from '../database/schemas/api-key.schema';

@Injectable()
export class ApiKeyRepositoryImpl implements ApiKeyRepository {
    constructor(
        @InjectModel(ApiKeyDocumentClass.name) private readonly model: Model<ApiKeyDocument>,
    ) { }

    async create(apiKey: ApiKey): Promise<ApiKey> {
        const doc = new this.model({
            _id: apiKey.id,
            companyId: apiKey.companyId,
            name: apiKey.name,
            key: apiKey.key,
            secretPrefix: apiKey.secretPrefix,
            permissions: apiKey.permissions,
            isActive: apiKey.isActive,
            createdAt: apiKey.createdAt,
            updatedAt: apiKey.updatedAt,
        });
        await doc.save();
        return apiKey;
    }

    async findById(id: string, companyId: string): Promise<ApiKey | null> {
        const doc = await this.model.findOne({ _id: id, companyId }).exec();
        if (!doc) return null;
        return this.toDomain(doc);
    }

    async findByPrefix(prefix: string): Promise<ApiKey | null> {
        const doc = await this.model.findOne({ secretPrefix: prefix, isActive: true }).exec();
        if (!doc) return null;
        return this.toDomain(doc);
    }

    async findAll(companyId: string): Promise<ApiKey[]> {
        const docs = await this.model.find({ companyId }).exec();
        return docs.map(doc => this.toDomain(doc));
    }

    async update(apiKey: ApiKey): Promise<ApiKey> {
        await this.model.updateOne(
            { _id: apiKey.id, companyId: apiKey.companyId },
            {
                name: apiKey.name,
                isActive: apiKey.isActive,
                permissions: apiKey.permissions,
                lastUsedAt: apiKey.lastUsedAt,
                updatedAt: apiKey.updatedAt,
            }
        ).exec();
        return apiKey;
    }

    async delete(id: string, companyId: string): Promise<void> {
        await this.model.deleteOne({ _id: id, companyId }).exec();
    }

    private toDomain(doc: ApiKeyDocument): ApiKey {
        return ApiKey.reconstruct({
            id: doc._id,
            companyId: doc.companyId,
            name: doc.name,
            key: doc.key,
            secretPrefix: doc.secretPrefix,
            permissions: doc.permissions as ApiKeyPermission[],
            isActive: doc.isActive,
            lastUsedAt: doc.lastUsedAt,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
        });
    }
}
