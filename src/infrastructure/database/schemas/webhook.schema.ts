import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type WebhookDocument = HydratedDocument<WebhookDocumentClass>;

@Schema({ collection: 'webhooks', timestamps: true })
export class WebhookDocumentClass {
    @Prop({ type: String })
    _id: string;

    @Prop({ required: true, index: true })
    companyId: string;

    @Prop({ required: true })
    url: string;

    @Prop({ type: [String], enum: ['INVOICE_CREATED', 'INVOICE_SENT_TO_DIAN', 'INVOICE_ACCEPTED', 'INVOICE_REJECTED'] })
    events: string[];

    @Prop({ required: true })
    secret: string;

    @Prop({ default: true })
    isActive: boolean;

    @Prop()
    createdAt: Date;

    @Prop()
    updatedAt: Date;
}

export const WebhookSchema = SchemaFactory.createForClass(WebhookDocumentClass);
