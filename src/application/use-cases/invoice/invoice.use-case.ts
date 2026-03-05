import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { InvoiceRepository, PaginatedResult } from '@domain/repositories/invoice.repository';
import { CustomerRepository } from '@domain/repositories/customer.repository';
import { CompanyRepository } from '@domain/repositories/company.repository';
import { CertificateRepository } from '@domain/repositories/certificate.repository';
import { Invoice, InvoiceItem } from '@domain/entities/invoice.entity';
import { Money } from '@domain/value-objects/money.vo';
import { Cufe } from '@domain/value-objects/cufe.vo';
import { Tax } from '@domain/value-objects/tax.vo';
import { TaxType } from '@domain/enums/tax-type.enum';
import { InvoiceStatus } from '@domain/enums/invoice-status.enum';
import { CufeCalculatorService } from '@domain/services/cufe-calculator.service';
import { IXmlGenerator } from '@application/interfaces/xml-generator.interface';
import { ISignerService } from '@application/interfaces/signer.interface';
import { IDianClient } from '@application/interfaces/dian-client.interface';
import {
    CreateInvoiceDto, InvoiceResponseDto, InvoiceListResponseDto,
} from '../../dtos/invoice/invoice.dto';
import { TOKENS } from '@shared/constants/tokens';
import { NotFoundException } from '@shared/exceptions/not-found.exception';
import { DomainException } from '@shared/exceptions/domain.exception';

/** Mapper simple de Invoice → DTO de respuesta */
const toResponse = (inv: Invoice): InvoiceResponseDto => ({
    id: inv.id,
    companyId: inv.companyId,
    number: inv.number,
    prefix: inv.prefix,
    fullNumber: inv.fullNumber,
    type: inv.type,
    status: inv.status,
    customerId: inv.customerId,
    items: inv.items.map(item => ({
        id: item.id,
        productCode: item.productCode,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice.value,
        discount: item.discount.value,
        subtotal: item.subtotal.value,
        totalTax: item.totalTax.value,
        total: item.total.value,
        taxes: item.taxes.map(t => ({
            type: t.type, rate: t.rate, base: t.base.value, amount: t.amount.value,
        })),
    })),
    subtotal: inv.subtotal.value,
    totalTax: inv.totalTax.value,
    total: inv.total.value,
    cufe: inv.cufe?.raw,
    qrCode: inv.qrCode ?? undefined,
    issueDate: inv.issueDate,
    dueDate: inv.dueDate ?? undefined,
    notes: inv.notes ?? undefined,
    dianResponse: inv.dianResponse ?? undefined,
    createdAt: inv.createdAt,
    updatedAt: inv.updatedAt,
});

/* ─── Create Invoice ──────────────────────────────────────────────────── */
@Injectable()
export class CreateInvoiceUseCase {
    constructor(
        @Inject(TOKENS.INVOICE_REPOSITORY) private readonly invoiceRepo: InvoiceRepository,
        @Inject(TOKENS.CUSTOMER_REPOSITORY) private readonly customerRepo: CustomerRepository,
        @Inject(TOKENS.COMPANY_REPOSITORY) private readonly companyRepo: CompanyRepository,
    ) { }

    async execute(dto: CreateInvoiceDto, companyId: string): Promise<InvoiceResponseDto> {
        const customer = await this.customerRepo.findById(dto.customerId, companyId);
        if (!customer) throw new NotFoundException('Customer');

        const company = await this.companyRepo.findById(companyId);
        if (!company) throw new NotFoundException('Company');

        const prefix = company.dianConfig.invoicePrefix ?? 'FACT';
        const nextNum = await this.invoiceRepo.getNextNumber(companyId, prefix);
        const number = String(nextNum).padStart(8, '0');

        const items: InvoiceItem[] = dto.items.map(itemDto => {
            const unitPrice = Money.of(itemDto.unitPrice);
            const discount = Money.of(itemDto.discount);
            const subtotal = unitPrice.multiply(itemDto.quantity).subtract(discount);

            const taxes: Tax[] = itemDto.taxes.map(taxDto =>
                Tax.create({ type: taxDto.type as TaxType, rate: taxDto.rate, base: subtotal })
            );
            const totalTax = taxes.reduce((acc, t) => acc.add(t.amount), Money.zero());
            const total = subtotal.add(totalTax);

            return new InvoiceItem(
                uuidv4(), itemDto.productCode, itemDto.description,
                itemDto.quantity, unitPrice, discount, subtotal, taxes, totalTax, total,
            );
        });

        const invoice = Invoice.create({
            id: uuidv4(),
            companyId,
            number,
            prefix,
            type: dto.type,
            customerId: dto.customerId,
            items,
            issueDate: new Date(dto.issueDate),
            dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
            notes: dto.notes,
        });

        const saved = await this.invoiceRepo.create(invoice);
        return toResponse(saved);
    }
}

/* ─── Get Invoices ────────────────────────────────────────────────────── */
@Injectable()
export class GetInvoicesUseCase {
    constructor(
        @Inject(TOKENS.INVOICE_REPOSITORY) private readonly invoiceRepo: InvoiceRepository,
    ) { }

    async execute(
        companyId: string,
        filters?: { status?: InvoiceStatus; from?: string; to?: string; customerId?: string },
        page = 1,
        limit = 20,
    ): Promise<InvoiceListResponseDto> {
        const result = await this.invoiceRepo.findAll(
            companyId,
            {
                status: filters?.status,
                from: filters?.from ? new Date(filters.from) : undefined,
                to: filters?.to ? new Date(filters.to) : undefined,
                customerId: filters?.customerId,
            },
            page,
            limit,
        );
        return {
            data: result.data.map(toResponse),
            total: result.total,
            page: result.page,
            limit: result.limit,
        };
    }
}

/* ─── Get Invoice By ID ───────────────────────────────────────────────── */
@Injectable()
export class GetInvoiceByIdUseCase {
    constructor(
        @Inject(TOKENS.INVOICE_REPOSITORY) private readonly invoiceRepo: InvoiceRepository,
    ) { }

    async execute(id: string, companyId: string): Promise<InvoiceResponseDto> {
        const invoice = await this.invoiceRepo.findById(id, companyId);
        if (!invoice) throw new NotFoundException('Invoice');
        return toResponse(invoice);
    }
}

/* ─── Send to DIAN ────────────────────────────────────────────────────── */
@Injectable()
export class SendToDianUseCase {
    constructor(
        @Inject(TOKENS.INVOICE_REPOSITORY) private readonly invoiceRepo: InvoiceRepository,
        @Inject(TOKENS.COMPANY_REPOSITORY) private readonly companyRepo: CompanyRepository,
        @Inject(TOKENS.CUSTOMER_REPOSITORY) private readonly customerRepo: CustomerRepository,
        @Inject(TOKENS.CERTIFICATE_REPOSITORY) private readonly certRepo: CertificateRepository,
        @Inject(TOKENS.XML_GENERATOR) private readonly xmlGenerator: IXmlGenerator,
        @Inject(TOKENS.SIGNER_SERVICE) private readonly signer: ISignerService,
        @Inject(TOKENS.DIAN_CLIENT) private readonly dianClient: IDianClient,
        private readonly cufeCalc: CufeCalculatorService,
    ) { }

    async execute(invoiceId: string, companyId: string): Promise<InvoiceResponseDto> {
        // 1. Validar contexto
        const invoice = await this.invoiceRepo.findById(invoiceId, companyId);
        if (!invoice) throw new NotFoundException('Invoice');
        if (!invoice.isDraft()) throw new DomainException('Only DRAFT invoices can be sent to DIAN');

        const company = await this.companyRepo.findById(companyId);
        if (!company) throw new NotFoundException('Company');

        const dian = company.dianConfig;
        if (!dian.softwareId || !dian.resolutionNumber) {
            throw new DomainException('DIAN configuration is incomplete. Set softwareId and resolution number first.');
        }

        const cert = await this.certRepo.findActive(companyId);
        if (!cert) throw new DomainException('No active certificate found. Upload a .p12 certificate first.');
        if (cert.isExpired()) throw new DomainException('Certificate is expired. Please upload a valid certificate.');

        const customer = await this.customerRepo.findById(invoice.customerId, companyId);
        if (!customer) throw new NotFoundException('Customer');

        // 2. Marcar como PENDING (estado intermedio)
        invoice.markAsPending();
        await this.invoiceRepo.update(invoice);

        try {
            // 3. Calcular CUFE
            const cufe = this.cufeCalc.calculate(invoice, {
                nitOfe: company.nit.raw,
                numAdq: customer.documentNumber,
                technicalKey: dian.technicalKey!,
                environment: dian.isTestEnvironment ? '2' : '1',
            });

            // 4. Generar XML UBL 2.1
            const xml = await this.xmlGenerator.generate({
                invoice,
                cufe,
                companyData: {
                    nit: company.nit.raw,
                    dv: company.nit.checkDigit,
                    businessName: company.businessName,
                    address: company.address,
                    city: company.city,
                    department: company.department,
                    taxRegime: company.taxRegime,
                    economicActivity: company.economicActivity,
                    email: company.email.raw,
                    phone: company.phone,
                    softwareId: dian.softwareId!,
                    resolutionNumber: dian.resolutionNumber!,
                    resolutionDate: dian.resolutionDate?.toISOString().split('T')[0] ?? '',
                    technicalKey: dian.technicalKey!,
                },
                customerData: {
                    documentType: customer.documentType,
                    documentNumber: customer.documentNumber,
                    firstName: customer.firstName,
                    lastName: customer.lastName,
                    businessName: customer.businessName,
                    email: customer.email.raw,
                    phone: customer.phone,
                    address: customer.address,
                    city: customer.city,
                },
                environment: dian.isTestEnvironment ? '2' : '1',
            });

            // 5. Firmar con XAdES-BES
            const signedXml = await this.signer.sign({
                xml,
                encryptedP12: cert.encryptedP12,
                encryptionIV: cert.encryptionIV,
                certPassword: cert.certPassword,
            });

            invoice.markAsSent();
            await this.invoiceRepo.update(invoice);

            // 6. Enviar a DIAN
            const dianResponse = await this.dianClient.sendInvoice({
                signedXml,
                companyNit: company.nit.raw,
                softwareId: dian.softwareId!,
            });

            // 7. Actualizar estado según respuesta DIAN
            if (dianResponse.isAccepted) {
                const acceptedCufe = dianResponse.cufe ? Cufe.fromHash(dianResponse.cufe) : cufe;
                invoice.markAsAccepted(acceptedCufe, dianResponse.qrCode ?? '', dianResponse.rawResponse);
            } else {
                invoice.markAsRejected(dianResponse.statusMessage);
            }

            const updated = await this.invoiceRepo.update(invoice);
            return toResponse(updated);
        } catch (error) {
            // Si hay error técnico, regresamos a DRAFT para permitir reintento
            invoice.markAsRejected(error instanceof Error ? error.message : 'Unknown error');
            await this.invoiceRepo.update(invoice);
            throw error;
        }
    }
}

/* ─── Cancel Invoice ──────────────────────────────────────────────────── */
@Injectable()
export class CancelInvoiceUseCase {
    constructor(
        @Inject(TOKENS.INVOICE_REPOSITORY) private readonly invoiceRepo: InvoiceRepository,
    ) { }

    async execute(invoiceId: string, companyId: string): Promise<InvoiceResponseDto> {
        const invoice = await this.invoiceRepo.findById(invoiceId, companyId);
        if (!invoice) throw new NotFoundException('Invoice');
        invoice.cancel();
        const updated = await this.invoiceRepo.update(invoice);
        return toResponse(updated);
    }
}
