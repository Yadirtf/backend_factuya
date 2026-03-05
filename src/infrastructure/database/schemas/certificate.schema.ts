import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'certificates' })
export class CertificateDocument extends Document {
    @Prop({ required: true, index: true }) companyId: string;
    @Prop({ required: true }) encryptedP12: string;
    @Prop({ required: true }) encryptionIV: string;
    @Prop({ required: true }) certPassword: string;
    @Prop({ required: true }) validFrom: Date;
    @Prop({ required: true }) validTo: Date;
    @Prop({ required: true }) issuedBy: string;
    @Prop({ default: true }) isActive: boolean;
    @Prop({ default: Date.now }) uploadedAt: Date;
}

export const CertificateSchema = SchemaFactory.createForClass(CertificateDocument);
CertificateSchema.index({ companyId: 1, isActive: 1 });
