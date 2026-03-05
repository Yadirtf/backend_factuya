import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CertificateRepository } from '@domain/repositories/certificate.repository';
import { Certificate } from '@domain/entities/certificate.entity';
import { CertificateDocument } from '@infrastructure/database/schemas/certificate.schema';

@Injectable()
export class CertificateRepositoryImpl implements CertificateRepository {
    constructor(
        @InjectModel(CertificateDocument.name) private readonly model: Model<CertificateDocument>,
    ) { }

    async create(cert: Certificate): Promise<Certificate> {
        const doc = await this.model.create(this.toDocument(cert));
        return this.toDomain(doc);
    }

    async findById(id: string, companyId: string): Promise<Certificate | null> {
        const doc = await this.model.findOne({ _id: id, companyId }).exec();
        return doc ? this.toDomain(doc) : null;
    }

    async findActive(companyId: string): Promise<Certificate | null> {
        const doc = await this.model.findOne({ companyId, isActive: true }).exec();
        return doc ? this.toDomain(doc) : null;
    }

    async deactivateAll(companyId: string): Promise<void> {
        await this.model.updateMany({ companyId }, { isActive: false }).exec();
    }

    async update(cert: Certificate): Promise<Certificate> {
        const doc = await this.model.findByIdAndUpdate(cert.id, this.toDocument(cert), { new: true }).exec();
        return this.toDomain(doc!);
    }

    private toDocument(c: Certificate): Record<string, unknown> {
        return {
            _id: c.id, companyId: c.companyId, encryptedP12: c.encryptedP12,
            encryptionIV: c.encryptionIV, certPassword: c.certPassword,
            validFrom: c.validFrom, validTo: c.validTo, issuedBy: c.issuedBy,
            isActive: c.isActive, uploadedAt: c.uploadedAt,
        };
    }

    private toDomain(doc: CertificateDocument): Certificate {
        return Certificate.reconstitute({
            id: doc._id.toString(), companyId: doc.companyId,
            encryptedP12: doc.encryptedP12, encryptionIV: doc.encryptionIV,
            certPassword: doc.certPassword, validFrom: doc.validFrom, validTo: doc.validTo,
            issuedBy: doc.issuedBy, isActive: doc.isActive, uploadedAt: doc.uploadedAt,
        });
    }
}
