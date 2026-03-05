import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CompanyRepository } from '@domain/repositories/company.repository';
import { Company, DianConfig } from '@domain/entities/company.entity';
import { CompanyDocument, CompanyHydratedDocument } from '@infrastructure/database/schemas/company.schema';

@Injectable()
export class CompanyRepositoryImpl implements CompanyRepository {
    constructor(
        @InjectModel(CompanyDocument.name) private readonly model: Model<CompanyHydratedDocument>,
    ) { }

    async create(company: Company): Promise<Company> {
        const doc = await this.model.create(this.toDocument(company));
        return this.toDomain(doc);
    }

    async findById(id: string): Promise<Company | null> {
        const doc = await this.model.findById(id).exec();
        return doc ? this.toDomain(doc) : null;
    }

    async findByNit(nit: string): Promise<Company | null> {
        const doc = await this.model.findOne({ nit }).exec();
        return doc ? this.toDomain(doc) : null;
    }

    async update(company: Company): Promise<Company> {
        const doc = await this.model
            .findByIdAndUpdate(company.id, this.toDocument(company), { new: true })
            .exec();
        return this.toDomain(doc!);
    }

    async findAll(page = 1, limit = 20): Promise<{ data: Company[]; total: number }> {
        const [docs, total] = await Promise.all([
            this.model.find().skip((page - 1) * limit).limit(limit).exec(),
            this.model.countDocuments(),
        ]);
        return { data: docs.map(d => this.toDomain(d)), total };
    }

    private toDocument(company: Company): Record<string, unknown> {
        return {
            _id: company.id,
            nit: company.nit.raw,
            businessName: company.businessName,
            tradeName: company.tradeName,
            email: company.email.raw,
            phone: company.phone,
            address: company.address,
            city: company.city,
            department: company.department,
            taxRegime: company.taxRegime,
            economicActivity: company.economicActivity,
            dianConfig: company.dianConfig,
            isActive: company.isActive,
        };
    }

    private toDomain(doc: CompanyHydratedDocument): Company {
        return Company.reconstitute({
            id: doc._id.toString(),
            nit: doc.nit,
            businessName: doc.businessName,
            email: doc.email,
            address: doc.address,
            city: doc.city,
            department: doc.department,
            taxRegime: doc.taxRegime as 'SIMPLIFIED' | 'COMMON',
            economicActivity: doc.economicActivity,
            phone: doc.phone,
            tradeName: doc.tradeName,
            dianConfig: (doc.dianConfig as unknown as DianConfig) ?? { isTestEnvironment: true },
            isActive: doc.isActive,
            createdAt: (doc as any).createdAt ?? new Date(),
            updatedAt: (doc as any).updatedAt ?? new Date(),
        });
    }
}
