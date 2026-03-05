import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'customers' })
export class CustomerDocument extends Document {
    @Prop({ required: true, index: true }) companyId: string;
    @Prop({ required: true, enum: ['13', '31', '22', '41', '12', '50'] }) documentType: string;
    @Prop({ required: true }) documentNumber: string;
    @Prop({ required: true }) firstName: string;
    @Prop({ required: true }) lastName: string;
    @Prop() businessName?: string;
    @Prop({ required: true }) email: string;
    @Prop({ required: true }) phone: string;
    @Prop({ required: true }) address: string;
    @Prop({ required: true }) city: string;
    @Prop({ required: true }) department: string;
    @Prop({ default: true }) isActive: boolean;
}

export const CustomerSchema = SchemaFactory.createForClass(CustomerDocument);
CustomerSchema.index({ companyId: 1, documentNumber: 1 }, { unique: true });
CustomerSchema.index({ companyId: 1, email: 1 });
