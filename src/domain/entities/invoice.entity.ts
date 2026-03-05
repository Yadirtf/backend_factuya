import { Money } from '../value-objects/money.vo';
import { Tax } from '../value-objects/tax.vo';
import { Cufe } from '../value-objects/cufe.vo';
import { InvoiceType } from '../enums/invoice-type.enum';
import { InvoiceStatus } from '../enums/invoice-status.enum';
import { DomainException } from '@shared/exceptions/domain.exception';

export class InvoiceItem {
    constructor(
        public readonly id: string,
        public readonly productCode: string,
        public readonly description: string,
        public readonly quantity: number,
        public readonly unitPrice: Money,
        public readonly discount: Money,
        public readonly subtotal: Money,
        public readonly taxes: Tax[],
        public readonly totalTax: Money,
        public readonly total: Money,
    ) { }
}

export class Invoice {
    private constructor(
        public readonly id: string,
        public readonly companyId: string,
        private _number: string,
        private _prefix: string,
        private _type: InvoiceType,
        private _status: InvoiceStatus,
        private _customerId: string,
        private _items: InvoiceItem[],
        private _subtotal: Money,
        private _totalTax: Money,
        private _total: Money,
        private _cufe: Cufe | null,
        private _qrCode: string | null,
        private _xmlPath: string | null,
        private _dianResponse: string | null,
        private _issueDate: Date,
        private _dueDate: Date | null,
        private _notes: string | null,
        public readonly createdAt: Date,
        private _updatedAt: Date,
    ) { }

    static create(params: {
        id: string;
        companyId: string;
        number: string;
        prefix: string;
        type: InvoiceType;
        customerId: string;
        items: InvoiceItem[];
        issueDate: Date;
        dueDate?: Date;
        notes?: string;
    }): Invoice {
        if (params.items.length === 0) {
            throw new DomainException('Invoice must have at least one item');
        }

        const subtotal = params.items.reduce(
            (acc, item) => acc.add(item.subtotal), Money.zero()
        );
        const totalTax = params.items.reduce(
            (acc, item) => acc.add(item.totalTax), Money.zero()
        );
        const total = subtotal.add(totalTax);

        return new Invoice(
            params.id,
            params.companyId,
            params.number,
            params.prefix,
            params.type,
            InvoiceStatus.DRAFT,
            params.customerId,
            params.items,
            subtotal,
            totalTax,
            total,
            null,
            null,
            null,
            null,
            params.issueDate,
            params.dueDate ?? null,
            params.notes ?? null,
            new Date(),
            new Date(),
        );
    }

    static reconstitute(params: {
        id: string;
        companyId: string;
        number: string;
        prefix: string;
        type: InvoiceType;
        status: InvoiceStatus;
        customerId: string;
        items: InvoiceItem[];
        subtotal: Money;
        totalTax: Money;
        total: Money;
        cufe: Cufe | null;
        qrCode: string | null;
        xmlPath: string | null;
        dianResponse: string | null;
        issueDate: Date;
        dueDate: Date | null;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }): Invoice {
        return new Invoice(
            params.id, params.companyId, params.number, params.prefix, params.type,
            params.status, params.customerId, params.items, params.subtotal,
            params.totalTax, params.total, params.cufe, params.qrCode, params.xmlPath,
            params.dianResponse, params.issueDate, params.dueDate, params.notes,
            params.createdAt, params.updatedAt,
        );
    }

    get number(): string { return this._number; }
    get prefix(): string { return this._prefix; }
    get fullNumber(): string { return `${this._prefix}${this._number}`; }
    get type(): InvoiceType { return this._type; }
    get status(): InvoiceStatus { return this._status; }
    get customerId(): string { return this._customerId; }
    get items(): InvoiceItem[] { return [...this._items]; }
    get subtotal(): Money { return this._subtotal; }
    get totalTax(): Money { return this._totalTax; }
    get total(): Money { return this._total; }
    get cufe(): Cufe | null { return this._cufe; }
    get qrCode(): string | null { return this._qrCode; }
    get xmlPath(): string | null { return this._xmlPath; }
    get dianResponse(): string | null { return this._dianResponse; }
    get issueDate(): Date { return this._issueDate; }
    get dueDate(): Date | null { return this._dueDate; }
    get notes(): string | null { return this._notes; }
    get updatedAt(): Date { return this._updatedAt; }

    isDraft(): boolean { return this._status === InvoiceStatus.DRAFT; }
    isAccepted(): boolean { return this._status === InvoiceStatus.ACCEPTED; }

    markAsPending(): void {
        if (!this.isDraft()) throw new DomainException('Only DRAFT invoices can be sent');
        this._status = InvoiceStatus.PENDING;
        this._updatedAt = new Date();
    }

    markAsSent(): void {
        this._status = InvoiceStatus.SENT;
        this._updatedAt = new Date();
    }

    markAsAccepted(cufe: Cufe, qrCode: string, dianResponse: string): void {
        this._status = InvoiceStatus.ACCEPTED;
        this._cufe = cufe;
        this._qrCode = qrCode;
        this._dianResponse = dianResponse;
        this._updatedAt = new Date();
    }

    markAsRejected(reason: string): void {
        this._status = InvoiceStatus.REJECTED;
        this._dianResponse = reason;
        this._updatedAt = new Date();
    }

    cancel(): void {
        if (this._status === InvoiceStatus.CANCELLED) {
            throw new DomainException('Invoice is already cancelled');
        }
        if (this._status === InvoiceStatus.ACCEPTED) {
            throw new DomainException('Accepted invoices cannot be cancelled directly. Issue a credit note.');
        }
        this._status = InvoiceStatus.CANCELLED;
        this._updatedAt = new Date();
    }

    attachXml(path: string): void {
        this._xmlPath = path;
        this._updatedAt = new Date();
    }
}
