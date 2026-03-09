import { ApiKey } from '../entities/api-key.entity';

export interface ApiKeyRepository {
    create(apiKey: ApiKey): Promise<ApiKey>;
    findById(id: string, companyId: string): Promise<ApiKey | null>;
    findByPrefix(prefix: string): Promise<ApiKey | null>;
    findAll(companyId: string): Promise<ApiKey[]>;
    update(apiKey: ApiKey): Promise<ApiKey>;
    delete(id: string, companyId: string): Promise<void>;
}
