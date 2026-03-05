import { Cufe } from '@domain/value-objects/cufe.vo';
import { Invoice } from '@domain/entities/invoice.entity';

export interface GenerateXmlInput {
    invoice: Invoice;
    cufe: Cufe;
    companyData: {
        nit: string;
        dv: number;
        businessName: string;
        address: string;
        city: string;
        department: string;
        taxRegime: string;
        economicActivity: string;
        email: string;
        phone: string;
        softwareId: string;
        resolutionNumber: string;
        resolutionDate: string;
        technicalKey: string;
    };
    customerData: {
        documentType: string;
        documentNumber: string;
        firstName: string;
        lastName: string;
        businessName?: string;
        email: string;
        phone: string;
        address: string;
        city: string;
    };
    environment: '1' | '2';
}

/** Puerto de salida: generador de XML UBL 2.1 conforme a DIAN */
export interface IXmlGenerator {
    generate(input: GenerateXmlInput): Promise<string>;
}
