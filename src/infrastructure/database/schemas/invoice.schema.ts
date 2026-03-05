import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type InvoiceHydratedDocument = HydratedDocument<InvoiceDocument>;

@Schema({ _id: false })
class TaxSubDoc {
    @Prop({ required: true }) type: string;
    @Prop({ required: true }) rate: number;
    @Prop({ required: true }) base: number;
    @Prop({ required: true }) amount: number;
}

@Schema({ _id: false })
class InvoiceItemSubDoc {
    @Prop({ type: String }) _id: string;
    @Prop({ required: true }) productCode: string;
    @Prop({ required: true }) description: string;
    @Prop({ required: true }) quantity: number;
    @Prop({ required: true }) unitPrice: number;   // En centavos
    @Prop({ default: 0 }) discount: number;
    @Prop({ required: true }) subtotal: number;
    @Prop({ default: 0 }) totalTax: number;
    @Prop({ required: true }) total: number;
    @Prop({ type: [Object], default: [] }) taxes: TaxSubDoc[];
}

@Schema({ timestamps: true, collection: 'invoices' })
export class InvoiceDocument {
    @Prop({ type: String }) _id: string;
    @Prop({ required: true, index: true }) companyId: string;
    @Prop({ required: true }) number: string;
    @Prop({ required: true }) prefix: string;
    @Prop({ required: true, enum: ['FV', 'NC', 'ND'] }) type: string;
    @Prop({ required: true, enum: ['DRAFT', 'PENDING', 'SENT', 'ACCEPTED', 'REJECTED', 'CANCELLED'], default: 'DRAFT' })
    status: string;
    @Prop({ required: true, index: true }) customerId: string;
    @Prop({ type: [InvoiceItemSubDoc], default: [] }) items: InvoiceItemSubDoc[];
    @Prop({ required: true }) subtotal: number;   // En centavos
    @Prop({ default: 0 }) totalTax: number;
    @Prop({ required: true }) total: number;
    @Prop({ type: String }) cufe?: string;
    @Prop({ type: String }) qrCode?: string;
    @Prop({ type: String }) xmlPath?: string;
    @Prop({ type: String }) dianResponse?: string;
    @Prop({ required: true }) issueDate: Date;
    @Prop({ type: Date }) dueDate?: Date;
    @Prop({ type: String }) notes?: string;
}

export const InvoiceSchema = SchemaFactory.createForClass(InvoiceDocument);
InvoiceSchema.index({ companyId: 1, createdAt: -1 });
InvoiceSchema.index({ companyId: 1, status: 1 });
InvoiceSchema.index({ companyId: 1, prefix: 1, number: 1 }, { unique: true });
InvoiceSchema.index({ companyId: 1, customerId: 1 });
