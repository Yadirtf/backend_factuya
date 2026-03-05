import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InvoiceRepository, InvoiceFilters, PaginatedResult } from '@domain/repositories/invoice.repository';
import { Invoice, InvoiceItem } from '@domain/entities/invoice.entity';
import { Money } from '@domain/value-objects/money.vo';
import { Tax } from '@domain/value-objects/tax.vo';
import { Cufe } from '@domain/value-objects/cufe.vo';
import { InvoiceType } from '@domain/enums/invoice-type.enum';
import { InvoiceStatus } from '@domain/enums/invoice-status.enum';
import { TaxType } from '@domain/enums/tax-type.enum';
import { InvoiceDocument } from '@infrastructure/database/schemas/invoice.schema';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class InvoiceRepositoryImpl implements InvoiceRepository {
    constructor(
        @InjectModel(InvoiceDocument.name) private readonly model: Model<InvoiceDocument>,
    ) { }

    async create(invoice: Invoice): Promise<Invoice> {
        const doc = await this.model.create(this.toDocument(invoice));
        return this.toDomain(doc);
    }

    async findById(id: string, companyId: string): Promise<Invoice | null> {
        const doc = await this.model.findOne({ _id: id, companyId }).exec();
        return doc ? this.toDomain(doc) : null;
    }

    async findAll(companyId: string, filters?: InvoiceFilters, page = 1, limit = 20): Promise<PaginatedResult<Invoice>> {
        const query: Record<string, unknown> = { companyId };
        if (filters?.status) query.status = filters.status;
        if (filters?.customerId) query.customerId = filters.customerId;
        if (filters?.from || filters?.to) {
            const dateFilter: Record<string, Date> = {};
            if (filters.from) dateFilter['$gte'] = filters.from;
            if (filters.to) dateFilter['$lte'] = filters.to;
            query['issueDate'] = dateFilter;
        }
        const [docs, total] = await Promise.all([
            this.model.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).exec(),
            this.model.countDocuments(query),
        ]);
        return { data: docs.map(d => this.toDomain(d)), total, page, limit };
    }

    async update(invoice: Invoice): Promise<Invoice> {
        const doc = await this.model.findByIdAndUpdate(
            invoice.id, { $set: this.toDocument(invoice) }, { new: true },
        ).exec();
        return this.toDomain(doc!);
    }

    async getNextNumber(companyId: string, prefix: string): Promise<number> {
        // Operación atómica: busca la última factura y retorna el siguiente número
        const last = await this.model
            .findOne({ companyId, prefix })
            .sort({ number: -1 })
            .exec();
        if (!last) return 1;
        return parseInt(last.number) + 1;
    }

    private toDocument(invoice: Invoice): Record<string, unknown> {
        return {
            _id: invoice.id,
            companyId: invoice.companyId,
            number: invoice.number,
            prefix: invoice.prefix,
            type: invoice.type,
            status: invoice.status,
            customerId: invoice.customerId,
            items: invoice.items.map(item => ({
                _id: item.id,
                productCode: item.productCode,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice.asCents,
                discount: item.discount.asCents,
                subtotal: item.subtotal.asCents,
                totalTax: item.totalTax.asCents,
                total: item.total.asCents,
                taxes: item.taxes.map(t => ({ type: t.type, rate: t.rate, base: t.base.value, amount: t.amount.value })),
            })),
            subtotal: invoice.subtotal.asCents,
            totalTax: invoice.totalTax.asCents,
            total: invoice.total.asCents,
            cufe: invoice.cufe?.raw,
            qrCode: invoice.qrCode,
            xmlPath: invoice.xmlPath,
            dianResponse: invoice.dianResponse,
            issueDate: invoice.issueDate,
            dueDate: invoice.dueDate,
            notes: invoice.notes,
        };
    }

    private toDomain(doc: InvoiceDocument): Invoice {
        const items: InvoiceItem[] = (doc.items as any[]).map(item => {
            const taxes: Tax[] = (item.taxes ?? []).map((t: any) =>
                Tax.reconstitute({ type: t.type as TaxType, rate: t.rate, base: Money.of(t.base), amount: Money.of(t.amount) })
            );
            const totalTax = taxes.reduce((acc, t) => acc.add(t.amount), Money.zero());
            return new InvoiceItem(
                item._id?.toString() ?? uuidv4(),
                item.productCode, item.description, item.quantity,
                Money.fromCents(item.unitPrice),
                Money.fromCents(item.discount),
                Money.fromCents(item.subtotal),
                taxes,
                Money.fromCents(item.totalTax),
                Money.fromCents(item.total),
            );
        });

        return Invoice.reconstitute({
            id: doc._id.toString(),
            companyId: doc.companyId,
            number: doc.number,
            prefix: doc.prefix,
            type: doc.type as InvoiceType,
            status: doc.status as InvoiceStatus,
            customerId: doc.customerId,
            items,
            subtotal: Money.fromCents(doc.subtotal),
            totalTax: Money.fromCents(doc.totalTax),
            total: Money.fromCents(doc.total),
            cufe: doc.cufe ? Cufe.fromHash(doc.cufe) : null,
            qrCode: doc.qrCode ?? null,
            xmlPath: doc.xmlPath ?? null,
            dianResponse: doc.dianResponse ?? null,
            issueDate: doc.issueDate,
            dueDate: doc.dueDate ?? null,
            notes: doc.notes ?? null,
            createdAt: (doc as any).createdAt ?? new Date(),
            updatedAt: (doc as any).updatedAt ?? new Date(),
        });
    }
}
