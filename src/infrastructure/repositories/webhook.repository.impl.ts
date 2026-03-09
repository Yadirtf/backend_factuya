import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WebhookRepository } from '@domain/repositories/webhook.repository';
import { Webhook, WebhookEvent } from '@domain/entities/webhook.entity';
import { WebhookDocumentClass, WebhookDocument } from '../database/schemas/webhook.schema';

@Injectable()
export class WebhookRepositoryImpl implements WebhookRepository {
    constructor(
        @InjectModel(WebhookDocumentClass.name) private readonly model: Model<WebhookDocument>,
    ) { }

    async create(webhook: Webhook): Promise<Webhook> {
        const doc = new this.model({
            _id: webhook.id,
            companyId: webhook.companyId,
            url: webhook.url,
            events: webhook.events,
            secret: webhook.secret,
            isActive: webhook.isActive,
            createdAt: webhook.createdAt,
            updatedAt: webhook.updatedAt,
        });
        await doc.save();
        return webhook;
    }

    async findById(id: string, companyId: string): Promise<Webhook | null> {
        const doc = await this.model.findOne({ _id: id, companyId }).exec();
        if (!doc) return null;
        return this.toDomain(doc);
    }

    async findAll(companyId: string): Promise<Webhook[]> {
        const docs = await this.model.find({ companyId }).exec();
        return docs.map(doc => this.toDomain(doc));
    }

    async findByEvent(companyId: string, event: WebhookEvent): Promise<Webhook[]> {
        const docs = await this.model.find({ companyId, events: event, isActive: true }).exec();
        return docs.map(doc => this.toDomain(doc));
    }

    async update(webhook: Webhook): Promise<Webhook> {
        await this.model.updateOne(
            { _id: webhook.id, companyId: webhook.companyId },
            {
                url: webhook.url,
                events: webhook.events,
                isActive: webhook.isActive,
                updatedAt: webhook.updatedAt,
            }
        ).exec();
        return webhook;
    }

    async delete(id: string, companyId: string): Promise<void> {
        await this.model.deleteOne({ _id: id, companyId }).exec();
    }

    private toDomain(doc: WebhookDocument): Webhook {
        return Webhook.reconstruct({
            id: doc._id,
            companyId: doc.companyId,
            url: doc.url,
            events: doc.events as WebhookEvent[],
            secret: doc.secret,
            isActive: doc.isActive,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
        });
    }
}
