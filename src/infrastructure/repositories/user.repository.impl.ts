import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserRepository } from '@domain/repositories/user.repository';
import { User } from '@domain/entities/user.entity';
import { UserRole } from '@domain/enums/user-role.enum';
import { UserDocument, UserHydratedDocument } from '@infrastructure/database/schemas/user.schema';

@Injectable()
export class UserRepositoryImpl implements UserRepository {
    constructor(
        @InjectModel(UserDocument.name) private readonly model: Model<UserHydratedDocument>,
    ) { }

    async create(user: User): Promise<User> {
        const doc = await this.model.create(this.toDocument(user));
        return this.toDomain(doc);
    }

    async findById(id: string, companyId: string): Promise<User | null> {
        const doc = await this.model.findOne({ _id: id, companyId }).exec();
        return doc ? this.toDomain(doc) : null;
    }

    async findByEmail(email: string, companyId: string): Promise<User | null> {
        const doc = await this.model.findOne({ email, companyId }).exec();
        return doc ? this.toDomain(doc) : null;
    }

    async findByEmailGlobal(email: string): Promise<User | null> {
        const doc = await this.model.findOne({ email }).exec();
        return doc ? this.toDomain(doc) : null;
    }

    async findAll(companyId: string): Promise<User[]> {
        const docs = await this.model.find({ companyId }).exec();
        return docs.map(d => this.toDomain(d));
    }

    async update(user: User): Promise<User> {
        const doc = await this.model
            .findByIdAndUpdate(user.id, this.toDocument(user), { new: true })
            .exec();
        return this.toDomain(doc!);
    }

    async updateRefreshToken(userId: string, token: string | null): Promise<void> {
        await this.model.findByIdAndUpdate(userId, { refreshToken: token }).exec();
    }

    async countAdmins(): Promise<number> {
        return this.model.countDocuments({
            role: { $in: [UserRole.ADMIN, UserRole.SUPER_ADMIN] }
        }).exec();
    }

    private toDocument(user: User): Record<string, unknown> {
        return {
            _id: user.id,
            companyId: user.companyId,
            email: user.email.raw,
            passwordHash: user.passwordHash,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isActive: user.isActive,
            refreshToken: user.refreshToken,
        };
    }

    private toDomain(doc: UserHydratedDocument): User {
        return User.reconstitute({
            id: doc._id.toString(),
            companyId: doc.companyId,
            email: doc.email,
            passwordHash: doc.passwordHash,
            firstName: doc.firstName,
            lastName: doc.lastName,
            role: doc.role as UserRole,
            isActive: doc.isActive,
            refreshToken: doc.refreshToken,
            createdAt: (doc as any).createdAt ?? new Date(),
            updatedAt: (doc as any).updatedAt ?? new Date(),
        });
    }
}
