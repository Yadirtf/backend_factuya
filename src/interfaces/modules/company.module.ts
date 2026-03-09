import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CompanyController } from '../controllers/company.controller';
import { CompanyDocument, CompanySchema } from '@infrastructure/database/schemas/company.schema';
import { CertificateDocument, CertificateSchema } from '@infrastructure/database/schemas/certificate.schema';
import { CompanyRepositoryImpl } from '@infrastructure/repositories/company.repository.impl';
import { CertificateRepositoryImpl } from '@infrastructure/repositories/certificate.repository.impl';
import { AesEncryptorService } from '@infrastructure/security/aes-encryptor.service';
import { TOKENS } from '@shared/constants/tokens';
import { GetCompanyUseCase, UpdateCompanyUseCase, GetCompaniesUseCase, CreateCompanyUseCase } from '@application/use-cases/company/company.use-case';
import { UploadCertificateUseCase } from '@application/use-cases/company/upload-certificate.use-case';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: CompanyDocument.name, schema: CompanySchema },
            { name: CertificateDocument.name, schema: CertificateSchema }
        ]),
    ],
    controllers: [CompanyController],
    providers: [
        { provide: TOKENS.COMPANY_REPOSITORY, useClass: CompanyRepositoryImpl },
        { provide: TOKENS.CERTIFICATE_REPOSITORY, useClass: CertificateRepositoryImpl },
        { provide: TOKENS.CERTIFICATE_ENCRYPTOR, useClass: AesEncryptorService },
        CreateCompanyUseCase,
        GetCompanyUseCase,
        GetCompaniesUseCase,
        UpdateCompanyUseCase,
        UploadCertificateUseCase
    ],
    exports: [TOKENS.COMPANY_REPOSITORY, TOKENS.CERTIFICATE_REPOSITORY, TOKENS.CERTIFICATE_ENCRYPTOR],
})
export class CompanyModule { }
