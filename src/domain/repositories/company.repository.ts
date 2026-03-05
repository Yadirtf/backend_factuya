import { Company } from '../entities/company.entity';

export interface CompanyRepository {
    create(company: Company): Promise<Company>;
    findById(id: string): Promise<Company | null>;
    findByNit(nit: string): Promise<Company | null>;
    update(company: Company): Promise<Company>;
    findAll(page?: number, limit?: number): Promise<{ data: Company[]; total: number }>;
}
