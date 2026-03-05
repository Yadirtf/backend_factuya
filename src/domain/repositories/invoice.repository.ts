import { Invoice } from '../entities/invoice.entity';
import { InvoiceStatus } from '../enums/invoice-status.enum';

export interface InvoiceFilters {
    status?: InvoiceStatus;
    from?: Date;
    to?: Date;
    customerId?: string;
}

export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
}

export interface InvoiceRepository {
    create(invoice: Invoice): Promise<Invoice>;
    findById(id: string, companyId: string): Promise<Invoice | null>;
    findAll(companyId: string, filters?: InvoiceFilters, page?: number, limit?: number): Promise<PaginatedResult<Invoice>>;
    update(invoice: Invoice): Promise<Invoice>;
    /** Obtiene y reserva el siguiente número consecutivo de factura (atómico) */
    getNextNumber(companyId: string, prefix: string): Promise<number>;
}
