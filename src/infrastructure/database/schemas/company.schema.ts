import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CompanyHydratedDocument = HydratedDocument<CompanyDocument>;

@Schema({ timestamps: true, collection: 'companies' })
export class CompanyDocument {
    @Prop({ type: String }) _id: string;
    @Prop({ required: true, unique: true, index: true }) nit: string;
    @Prop({ required: true, minlength: 1, maxlength: 1 }) dv: string;
    @Prop({ required: true }) organizationType: number;
    @Prop({ required: true }) documentType: string;
    @Prop({ required: true }) businessName: string;
    @Prop({ type: String }) tradeName?: string;
    @Prop({ required: true }) email: string;
    @Prop({ required: true }) phone: string;
    @Prop({ required: true }) address: string;
    @Prop({ required: true }) postalCode: string;
    @Prop({ required: true }) city: string;
    @Prop({ required: true }) department: string;
    @Prop({ required: true, enum: ['SIMPLIFIED', 'COMMON'] }) taxRegime: string;
    @Prop({ type: [String], required: true }) taxResponsibilities: string[];
    @Prop({ required: true }) economicActivity: string;
    @Prop({ required: true }) mercantileRegistration: string;
    @Prop({ type: Object, default: { isTestEnvironment: true } }) dianConfig: Record<string, unknown>;
    @Prop({ default: true }) isActive: boolean;
}

export const CompanySchema = SchemaFactory.createForClass(CompanyDocument);
