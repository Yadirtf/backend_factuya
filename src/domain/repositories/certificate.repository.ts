import { Certificate } from '../entities/certificate.entity';

export interface CertificateRepository {
    create(certificate: Certificate): Promise<Certificate>;
    findById(id: string, companyId: string): Promise<Certificate | null>;
    findActive(companyId: string): Promise<Certificate | null>;
    deactivateAll(companyId: string): Promise<void>;
    update(certificate: Certificate): Promise<Certificate>;
}
