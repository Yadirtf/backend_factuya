import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ApiKeyDocumentClass, ApiKeySchema } from '@infrastructure/database/schemas/api-key.schema';
import { ApiKeyRepositoryImpl } from '@infrastructure/repositories/api-key.repository.impl';
import { ApiKeyController } from '../controllers/api-key.controller';
import { CreateApiKeyUseCase, GetApiKeysUseCase, RevokeApiKeyUseCase } from '@application/use-cases/api-key/api-key.use-case';
import { TOKENS } from '@shared/constants/tokens';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: ApiKeyDocumentClass.name, schema: ApiKeySchema },
        ]),
    ],
    controllers: [ApiKeyController],
    providers: [
        { provide: TOKENS.API_KEY_REPOSITORY, useClass: ApiKeyRepositoryImpl },
        CreateApiKeyUseCase,
        GetApiKeysUseCase,
        RevokeApiKeyUseCase,
    ],
    exports: [
        TOKENS.API_KEY_REPOSITORY,
    ],
})
export class ApiKeyModule { }
