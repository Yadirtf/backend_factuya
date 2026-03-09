import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ApiKeyDocument = HydratedDocument<ApiKeyDocumentClass>;

@Schema({ collection: 'api_keys', timestamps: true })
export class ApiKeyDocumentClass {
    @Prop({ type: String })
    _id: string;

    @Prop({ required: true, index: true })
    companyId: string;

    @Prop({ required: true })
    name: string;

    @Prop({ required: true, unique: true })
    key: string; // Hashed

    @Prop({ required: true, unique: true, index: true })
    secretPrefix: string;

    @Prop({ type: [String], enum: ['READ_INVOICES', 'WRITE_INVOICES', 'READ_CUSTOMERS', 'WRITE_CUSTOMERS'], default: ['WRITE_INVOICES', 'READ_INVOICES'] })
    permissions: string[];

    @Prop({ default: true })
    isActive: boolean;

    @Prop()
    lastUsedAt?: Date;

    @Prop()
    createdAt: Date;

    @Prop()
    updatedAt: Date;
}

export const ApiKeySchema = SchemaFactory.createForClass(ApiKeyDocumentClass);
