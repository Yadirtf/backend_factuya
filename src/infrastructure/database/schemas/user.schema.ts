import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserHydratedDocument = HydratedDocument<UserDocument>;

@Schema({ timestamps: true, collection: 'users' })
export class UserDocument {
    @Prop({ type: String }) _id: string;
    @Prop({ required: true, index: true }) companyId: string;
    @Prop({ required: true }) email: string;
    @Prop({ required: true }) passwordHash: string;
    @Prop({ required: true }) firstName: string;
    @Prop({ required: true }) lastName: string;
    @Prop({ required: true, enum: ['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'ACCOUNTANT', 'VIEWER'] }) role: string;
    @Prop({ default: true }) isActive: boolean;
    @Prop({ type: String, default: null }) refreshToken: string | null;
}

export const UserSchema = SchemaFactory.createForClass(UserDocument);
UserSchema.index({ companyId: 1, email: 1 }, { unique: true });
