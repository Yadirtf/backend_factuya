import { Inject, Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto';
import { WebhookRepository } from '@domain/repositories/webhook.repository';
import { WebhookEvent } from '@domain/entities/webhook.entity';
import { TOKENS } from '@shared/constants/tokens';

@Injectable()
export class WebhookService {
    private readonly logger = new Logger(WebhookService.name);

    constructor(
        @Inject(TOKENS.WEBHOOK_REPOSITORY) private readonly repo: WebhookRepository,
    ) { }

    async notify(companyId: string, event: WebhookEvent, data: any): Promise<void> {
        const webhooks = await this.repo.findByEvent(companyId, event);

        if (webhooks.length === 0) {
            this.logger.debug(`No active webhooks for company ${companyId} and event ${event}`);
            return;
        }

        const payload = {
            event,
            timestamp: new Date().toISOString(),
            companyId,
            data,
        };

        const payloadString = JSON.stringify(payload);

        const notifications = webhooks.map(async (webhook) => {
            try {
                // Generate HMAC signature
                const signature = crypto
                    .createHmac('sha256', webhook.secret)
                    .update(payloadString)
                    .digest('hex');

                await axios.post(webhook.url, payload, {
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': 'FactuYa-Webhook/1.0',
                        'X-FactuYa-Signature': signature,
                        'X-FactuYa-Event': event,
                    },
                    timeout: 5000,
                });

                this.logger.log(`Webhook sent successfully to ${webhook.url} for event ${event}`);
            } catch (error) {
                this.logger.error(`Failed to send webhook to ${webhook.url}: ${error.message}`);
                // In a production environment, we would implement a retry queue here (e.g., BullMQ)
            }
        });

        // Fire and forget (don't block the main flow)
        Promise.all(notifications).catch(err => {
            this.logger.error(`Error in webhook notification batch: ${err.message}`);
        });
    }
}
