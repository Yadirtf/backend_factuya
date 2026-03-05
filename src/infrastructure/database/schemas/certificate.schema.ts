import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CertificateHydratedDocument = HydratedDocument<CertificateDocument>;

@Schema({ collection: 'certificates' })
export class CertificateDocument {
    @Prop({ type: String }) _id: string;
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
