import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WebhookDocumentClass, WebhookSchema } from '@infrastructure/database/schemas/webhook.schema';
import { WebhookRepositoryImpl } from '@infrastructure/repositories/webhook.repository.impl';
import { WebhookController } from '../controllers/webhook.controller';
import { WebhookService } from '@application/services/webhook.service';
import { TOKENS } from '@shared/constants/tokens';
import { AuthModule } from './auth.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: WebhookDocumentClass.name, schema: WebhookSchema },
        ]),
        AuthModule,
    ],
    controllers: [WebhookController],
    providers: [
        { provide: TOKENS.WEBHOOK_REPOSITORY, useClass: WebhookRepositoryImpl },
        WebhookService,
    ],
    exports: [
        WebhookService,
        { provide: TOKENS.WEBHOOK_REPOSITORY, useClass: WebhookRepositoryImpl },
    ],
})
export class WebhookModule { }
