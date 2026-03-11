import { Customer } from '../entities/customer.entity';

export interface CustomerRepository {
    create(customer: Customer): Promise<Customer>;
    findById(id: string, companyId?: string | null): Promise<Customer | null>;
    findByDocument(documentNumber: string, companyId: string): Promise<Customer | null>;
    findAll(companyId?: string | null, search?: string, page?: number, limit?: number): Promise<{ data: Customer[]; total: number }>;
    update(customer: Customer): Promise<Customer>;
}
