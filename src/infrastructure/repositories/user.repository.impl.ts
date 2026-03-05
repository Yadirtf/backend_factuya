import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserRepository } from '@domain/repositories/user.repository';
import { User } from '@domain/entities/user.entity';
import { Email } from '@domain/value-objects/email.vo';
import { UserDocument, UserHydratedDocument } from '@infrastructure/database/schemas/user.schema';
import { RoleDocument, RoleHydratedDocument } from '@infrastructure/database/schemas/person_role.schema';

@Injectable()
export class UserRepositoryImpl implements UserRepository {
    constructor(
        @InjectModel(UserDocument.name) private readonly userModel: Model<UserHydratedDocument>,
        @InjectModel(RoleDocument.name) private readonly roleModel: Model<RoleHydratedDocument>,
    ) { }

    async create(user: User): Promise<User> {
        const doc = await this.userModel.create(this.toDocument(user));
        return this.toDomain(doc);
    }

    async findById(id: string, companyId: string): Promise<User | null> {
        const doc = await this.userModel.findOne({ _id: id, companyId }).exec();
        return doc ? this.toDomain(doc) : null;
    }

    async findByEmail(email: string, companyId: string): Promise<User | null> {
        const normalizedEmail = email.trim().toLowerCase();
        const doc = await this.userModel.findOne({ email: normalizedEmail, companyId }).exec();
        return doc ? this.toDomain(doc) : null;
    }

    async findByEmailGlobal(email: string): Promise<User | null> {
        const normalizedEmail = email.trim().toLowerCase();
        const doc = await this.userModel.findOne({ email: normalizedEmail }).exec();
        return doc ? this.toDomain(doc) : null;
    }

    async findAll(companyId: string): Promise<User[]> {
        const docs = await this.userModel.find({ companyId }).exec();
        return docs.map(d => this.toDomain(d));
    }

    async update(user: User): Promise<User> {
        const doc = await this.userModel
            .findByIdAndUpdate(user.id, this.toDocument(user), { new: true })
            .exec();
        return this.toDomain(doc!);
    }

    async updateRefreshToken(userId: string, token: string | null): Promise<void> {
        await this.userModel.findByIdAndUpdate(userId, { refreshToken: token }).exec();
    }

    async countAdmins(): Promise<number> {
        // Encontrar roles que sean ADMIN o SUPER_ADMIN
        const roles = await this.roleModel.find({
            code: { $in: ['ADMIN', 'SUPER_ADMIN'] }
        }).select('_id').exec();

        const roleIds = roles.map(r => r._id.toString());

        return this.userModel.countDocuments({
            roleId: { $in: roleIds }
        }).exec();
    }

    private toDocument(user: User): Record<string, unknown> {
        return {
            _id: user.id,
            companyId: user.companyId,
            personId: user.personId,
            roleId: user.roleId,
            email: user.email.raw,
            passwordHash: user.passwordHash,
            isActive: user.isActive,
            refreshToken: user.refreshToken,
        };
    }

    private toDomain(doc: UserHydratedDocument): User {
        return User.reconstitute({
            id: doc._id.toString(),
            companyId: doc.companyId,
            personId: doc.personId,
            roleId: doc.roleId,
            email: doc.email,
            passwordHash: doc.passwordHash,
            isActive: doc.isActive,
            refreshToken: doc.refreshToken,
            createdAt: (doc as any).createdAt ?? new Date(),
            updatedAt: (doc as any).updatedAt ?? new Date(),
        });
    }
}
