import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CompanyController } from '../controllers/company.controller';
import { CompanyDocument, CompanySchema } from '@infrastructure/database/schemas/company.schema';
import { CompanyRepositoryImpl } from '@infrastructure/repositories/company.repository.impl';
import { TOKENS } from '@shared/constants/tokens';
import { GetCompanyUseCase, UpdateCompanyUseCase } from '@application/use-cases/company/company.use-case';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: CompanyDocument.name, schema: CompanySchema }]),
    ],
    controllers: [CompanyController],
    providers: [
        { provide: TOKENS.COMPANY_REPOSITORY, useClass: CompanyRepositoryImpl },
        GetCompanyUseCase,
        UpdateCompanyUseCase,
    ],
    exports: [TOKENS.COMPANY_REPOSITORY],
})
export class CompanyModule { }
