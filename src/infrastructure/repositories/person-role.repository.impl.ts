import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RoleRepository, PersonRepository } from '@domain/repositories/person-role.repository';
import { Role, Permission } from '@domain/entities/role.entity';
import { Person } from '@domain/entities/person.entity';
import { RoleDocument, RoleHydratedDocument, PersonDocument, PersonHydratedDocument } from '@infrastructure/database/schemas/person_role.schema';

@Injectable()
export class RoleRepositoryImpl implements RoleRepository {
    constructor(
        @InjectModel(RoleDocument.name) private readonly roleModel: Model<RoleHydratedDocument>,
    ) { }

    async create(role: Role): Promise<Role> {
        const doc = await this.roleModel.create({
            _id: role.id,
            companyId: role.companyId,
            name: role.name,
            code: role.code,
            permissions: role.permissions,
        });
        return this.toDomainRole(doc);
    }

    async findById(id: string, companyId: string): Promise<Role | null> {
        const doc = await this.roleModel.findOne({ _id: id, companyId }).exec();
        return doc ? this.toDomainRole(doc) : null;
    }

    async findByCode(code: string, companyId: string): Promise<Role | null> {
        const doc = await this.roleModel.findOne({ code, companyId }).exec();
        return doc ? this.toDomainRole(doc) : null;
    }

    async findAll(companyId: string): Promise<Role[]> {
        const docs = await this.roleModel.find({ companyId }).exec();
        return docs.map(d => this.toDomainRole(d));
    }

    async update(role: Role): Promise<Role> {
        const doc = await this.roleModel
            .findByIdAndUpdate(role.id, {
                name: role.name,
                code: role.code,
                permissions: role.permissions,
            }, { new: true })
            .exec();
        return this.toDomainRole(doc!);
    }

    private toDomainRole(doc: RoleHydratedDocument): Role {
        return Role.reconstitute({
            id: doc._id.toString(),
            companyId: doc.companyId,
            name: doc.name,
            code: doc.code,
            permissions: doc.permissions as Permission[],
            createdAt: (doc as any).createdAt,
            updatedAt: (doc as any).updatedAt,
        });
    }
}

@Injectable()
export class PersonRepositoryImpl implements PersonRepository {
    constructor(
        @InjectModel(PersonDocument.name) private readonly personModel: Model<PersonHydratedDocument>,
    ) { }

    async create(person: Person): Promise<Person> {
        const doc = await this.personModel.create({
            _id: person.id,
            companyId: person.companyId,
            firstName: person.firstName,
            lastName: person.lastName,
            phone: person.phone,
        });
        return this.toDomainPerson(doc);
    }

    async findById(id: string, companyId: string): Promise<Person | null> {
        const doc = await this.personModel.findOne({ _id: id, companyId }).exec();
        return doc ? this.toDomainPerson(doc) : null;
    }

    async findAll(companyId: string): Promise<Person[]> {
        const docs = await this.personModel.find({ companyId }).exec();
        return docs.map(d => this.toDomainPerson(d));
    }

    async update(person: Person): Promise<Person> {
        const doc = await this.personModel
            .findByIdAndUpdate(person.id, {
                firstName: person.firstName,
                lastName: person.lastName,
                phone: person.phone,
            }, { new: true })
            .exec();
        return this.toDomainPerson(doc!);
    }

    private toDomainPerson(doc: PersonHydratedDocument): Person {
        return Person.reconstitute({
            id: doc._id.toString(),
            companyId: doc.companyId,
            firstName: doc.firstName,
            lastName: doc.lastName,
            phone: doc.phone,
            createdAt: (doc as any).createdAt,
            updatedAt: (doc as any).updatedAt,
        });
    }
}
