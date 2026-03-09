import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth.module';
import { WebhookModule } from './webhook.module';

import { InvoiceDocument, InvoiceSchema } from '@infrastructure/database/schemas/invoice.schema';
import { CustomerDocument, CustomerSchema } from '@infrastructure/database/schemas/customer.schema';
import { CompanyDocument, CompanySchema } from '@infrastructure/database/schemas/company.schema';
import { CertificateDocument, CertificateSchema } from '@infrastructure/database/schemas/certificate.schema';

import { InvoiceRepositoryImpl } from '@infrastructure/repositories/invoice.repository.impl';
import { CustomerRepositoryImpl } from '@infrastructure/repositories/customer.repository.impl';
import { CompanyRepositoryImpl } from '@infrastructure/repositories/company.repository.impl';
import { CertificateRepositoryImpl } from '@infrastructure/repositories/certificate.repository.impl';

import { DianSoapClient } from '@infrastructure/external/dian/dian-soap.client';
import { WsSecuritySignerService } from '@infrastructure/security/wsse-signer.service';
import { Ubl21GeneratorService } from '@infrastructure/external/xml/ubl21-generator.service';
import { XadesSignerService } from '@infrastructure/security/xades-signer.service';
import { AesEncryptorService } from '@infrastructure/security/aes-encryptor.service';

import {
    CreateInvoiceUseCase, GetInvoicesUseCase, GetInvoiceByIdUseCase,
    SendToDianUseCase, CancelInvoiceUseCase,
} from '@application/use-cases/invoice/invoice.use-case';
import { CufeCalculatorService } from '@domain/services/cufe-calculator.service';

import { InvoiceController } from '../controllers/invoice.controller';
import { TOKENS } from '@shared/constants/tokens';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: InvoiceDocument.name, schema: InvoiceSchema },
            { name: CustomerDocument.name, schema: CustomerSchema },
            { name: CompanyDocument.name, schema: CompanySchema },
            { name: CertificateDocument.name, schema: CertificateSchema },
        ]),
        AuthModule,
        WebhookModule,
    ],
    controllers: [InvoiceController],
    providers: [
        // Repositorios
        { provide: TOKENS.INVOICE_REPOSITORY, useClass: InvoiceRepositoryImpl },
        { provide: TOKENS.CUSTOMER_REPOSITORY, useClass: CustomerRepositoryImpl },
        { provide: TOKENS.COMPANY_REPOSITORY, useClass: CompanyRepositoryImpl },
        { provide: TOKENS.CERTIFICATE_REPOSITORY, useClass: CertificateRepositoryImpl },
        // Servicios externos
        { provide: TOKENS.DIAN_CLIENT, useClass: DianSoapClient },
        WsSecuritySignerService,
        { provide: TOKENS.XML_GENERATOR, useClass: Ubl21GeneratorService },
        { provide: TOKENS.CERTIFICATE_ENCRYPTOR, useClass: AesEncryptorService },
        {
            provide: TOKENS.SIGNER_SERVICE,
            useFactory: (encryptor: AesEncryptorService) => new XadesSignerService(encryptor),
            inject: [TOKENS.CERTIFICATE_ENCRYPTOR],
        },
        // Dominio
        CufeCalculatorService,
        // Use Cases
        CreateInvoiceUseCase,
        GetInvoicesUseCase,
        GetInvoiceByIdUseCase,
        SendToDianUseCase,
        CancelInvoiceUseCase,
    ],
})
export class InvoiceModule { }
