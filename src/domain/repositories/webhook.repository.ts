import { Webhook, WebhookEvent } from '../entities/webhook.entity';

export interface WebhookRepository {
    create(webhook: Webhook): Promise<Webhook>;
    findById(id: string, companyId: string): Promise<Webhook | null>;
    findAll(companyId: string): Promise<Webhook[]>;
    findByEvent(companyId: string, event: WebhookEvent): Promise<Webhook[]>;
    update(webhook: Webhook): Promise<Webhook>;
    delete(id: string, companyId: string): Promise<void>;
}
