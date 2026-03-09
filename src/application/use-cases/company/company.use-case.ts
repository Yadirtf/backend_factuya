import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CompanyRepository } from '@domain/repositories/company.repository';
import { TOKENS } from '@shared/constants/tokens';
import { Company } from '@domain/entities/company.entity';
import { UpdateCompanyDto, CreateCompanyDto } from '../../dtos/company/company.dto';
import { DomainException } from '@shared/exceptions/domain.exception';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CreateCompanyUseCase {
    constructor(
        @Inject(TOKENS.COMPANY_REPOSITORY) private readonly companyRepo: CompanyRepository,
    ) { }

    async execute(dto: CreateCompanyDto): Promise<Company> {
        const existing = await this.companyRepo.findByNit(dto.nit);
        if (existing) {
            throw new DomainException(`Company with NIT ${dto.nit} already exists`);
        }

        const company = Company.create({
            id: uuidv4(),
            nit: dto.nit,
            businessName: dto.businessName,
            email: dto.email || 'no-reply@facturaya.com',
            address: dto.address,
            city: dto.city,
            department: dto.department,
            taxRegime: dto.taxRegime,
            economicActivity: dto.economicActivity,
            phone: dto.phone,
            tradeName: dto.tradeName,
        });

        try {
            const result = await this.companyRepo.create(company);
            console.log('Company created successfully', result.id);
            return result;
        } catch (error) {
            console.error('FAILED TO CREATE COMPANY:', error);
            throw error;
        }
    }
}

interface GetCompanyInput {
    companyId: string;
}

@Injectable()
export class GetCompanyUseCase {
    constructor(
        @Inject(TOKENS.COMPANY_REPOSITORY) private readonly companyRepo: CompanyRepository,
    ) { }

    async execute(input: GetCompanyInput): Promise<Company> {
        const company = await this.companyRepo.findById(input.companyId);
        if (!company) {
            throw new NotFoundException('Company not found');
        }
        return company;
    }
}

@Injectable()
export class GetCompaniesUseCase {
    constructor(
        @Inject(TOKENS.COMPANY_REPOSITORY) private readonly companyRepo: CompanyRepository,
    ) { }

    async execute(page = 1, limit = 50): Promise<{ data: Company[]; total: number }> {
        return this.companyRepo.findAll(page, limit);
    }
}

interface UpdateCompanyInput extends UpdateCompanyDto {
    companyId: string;
}

@Injectable()
export class UpdateCompanyUseCase {
    constructor(
        @Inject(TOKENS.COMPANY_REPOSITORY) private readonly companyRepo: CompanyRepository,
    ) { }

    async execute(input: UpdateCompanyInput): Promise<Company> {
        const company = await this.companyRepo.findById(input.companyId);
        if (!company) {
            throw new NotFoundException('Company not found');
        }

        company.updateProfile(input);

        if (input.dianConfig) {
            company.updateDianConfig(input.dianConfig);
        }
        return this.companyRepo.update(company);
    }
}
