import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CustomerRepository } from '@domain/repositories/customer.repository';
import { Customer } from '@domain/entities/customer.entity';
import { DocumentType } from '@domain/enums/document-type.enum';
import { CustomerDocument, CustomerHydratedDocument } from '@infrastructure/database/schemas/customer.schema';

@Injectable()
export class CustomerRepositoryImpl implements CustomerRepository {
    constructor(
        @InjectModel(CustomerDocument.name) private readonly model: Model<CustomerHydratedDocument>,
    ) { }

    async create(customer: Customer): Promise<Customer> {
        const doc = await this.model.create(this.toDocument(customer));
        return this.toDomain(doc);
    }

    async findById(id: string, companyId: string): Promise<Customer | null> {
        const doc = await this.model.findOne({ _id: id, companyId }).exec();
        return doc ? this.toDomain(doc) : null;
    }

    async findByDocument(documentNumber: string, companyId: string): Promise<Customer | null> {
        const doc = await this.model.findOne({ documentNumber, companyId }).exec();
        return doc ? this.toDomain(doc) : null;
    }

    async findAll(companyId: string, search?: string, page = 1, limit = 20): Promise<{ data: Customer[]; total: number }> {
        const query: Record<string, unknown> = { companyId };
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { businessName: { $regex: search, $options: 'i' } },
                { documentNumber: { $regex: search, $options: 'i' } },
            ];
        }
        const [docs, total] = await Promise.all([
            this.model.find(query).skip((page - 1) * limit).limit(limit).exec(),
            this.model.countDocuments(query),
        ]);
        return { data: docs.map(d => this.toDomain(d)), total };
    }

    async update(customer: Customer): Promise<Customer> {
        const doc = await this.model.findByIdAndUpdate(customer.id, this.toDocument(customer), { new: true }).exec();
        return this.toDomain(doc!);
    }

    private toDocument(c: Customer): Record<string, unknown> {
        return {
            _id: c.id, companyId: c.companyId, documentType: c.documentType,
            documentNumber: c.documentNumber, firstName: c.firstName, lastName: c.lastName,
            businessName: c.businessName, email: c.email.raw, phone: c.phone,
            address: c.address, city: c.city, department: c.department, isActive: c.isActive,
        };
    }

    private toDomain(doc: CustomerHydratedDocument): Customer {
        return Customer.reconstitute({
            id: doc._id.toString(), companyId: doc.companyId,
            documentType: doc.documentType as DocumentType,
            documentNumber: doc.documentNumber, firstName: doc.firstName, lastName: doc.lastName,
            businessName: doc.businessName, email: doc.email, phone: doc.phone,
            address: doc.address, city: doc.city, department: doc.department,
            isActive: doc.isActive,
            createdAt: (doc as any).createdAt ?? new Date(),
            updatedAt: (doc as any).updatedAt ?? new Date(),
        });
    }
}
