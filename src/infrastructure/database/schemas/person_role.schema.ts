import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

// Person Schema
export type PersonHydratedDocument = HydratedDocument<PersonDocument>;

@Schema({ timestamps: true, collection: 'people' })
export class PersonDocument {
    @Prop({ type: String }) _id: string;
    @Prop({ required: true, index: true }) companyId: string;
    @Prop({ required: true }) firstName: string;
    @Prop({ required: true }) lastName: string;
    @Prop({ type: String, default: null }) phone: string | null;
}

export const PersonSchema = SchemaFactory.createForClass(PersonDocument);
PersonSchema.index({ companyId: 1, _id: 1 }, { unique: true });

// Role Schema
export type RoleHydratedDocument = HydratedDocument<RoleDocument>;

@Schema({ timestamps: true, collection: 'roles' })
export class RoleDocument {
    @Prop({ type: String }) _id: string;
    @Prop({ required: true, index: true }) companyId: string;
    @Prop({ required: true }) name: string;
    @Prop({ required: true, uppercase: true }) code: string;
    @Prop({ type: [String], default: [] }) permissions: string[];
}

export const RoleSchema = SchemaFactory.createForClass(RoleDocument);
RoleSchema.index({ companyId: 1, code: 1 }, { unique: true });
