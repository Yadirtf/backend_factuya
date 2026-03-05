import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CompanyRepository } from '@domain/repositories/company.repository';
import { TOKENS } from '@shared/constants/tokens';
import { Company } from '@domain/entities/company.entity';
import { UpdateCompanyDto } from '../../dtos/company/company.dto';

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
