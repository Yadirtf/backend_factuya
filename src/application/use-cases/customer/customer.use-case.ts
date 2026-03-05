import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CustomerRepository } from '@domain/repositories/customer.repository';
import { Customer } from '@domain/entities/customer.entity';
import { CreateCustomerDto, CustomerResponseDto, UpdateCustomerDto } from '../../dtos/customer/customer.dto';
import { TOKENS } from '@shared/constants/tokens';
import { NotFoundException } from '@shared/exceptions/not-found.exception';
import { DomainException } from '@shared/exceptions/domain.exception';
import { Email } from '@domain/value-objects/email.vo';

const toCustomerResponse = (c: Customer): CustomerResponseDto => ({
    id: c.id,
    companyId: c.companyId,
    documentType: c.documentType,
    documentNumber: c.documentNumber,
    firstName: c.firstName,
    lastName: c.lastName,
    displayName: c.displayName,
    businessName: c.businessName,
    email: c.email.raw,
    phone: c.phone,
    address: c.address,
    city: c.city,
    department: c.department,
    isActive: c.isActive,
});

@Injectable()
export class CreateCustomerUseCase {
    constructor(
        @Inject(TOKENS.CUSTOMER_REPOSITORY) private readonly repo: CustomerRepository,
    ) { }

    async execute(dto: CreateCustomerDto, companyId: string): Promise<CustomerResponseDto> {
        const existing = await this.repo.findByDocument(dto.documentNumber, companyId);
        if (existing) throw new DomainException(`Customer with document ${dto.documentNumber} already exists`);

        const customer = Customer.create({ id: uuidv4(), companyId, ...dto });
        const saved = await this.repo.create(customer);
        return toCustomerResponse(saved);
    }
}

@Injectable()
export class GetCustomersUseCase {
    constructor(
        @Inject(TOKENS.CUSTOMER_REPOSITORY) private readonly repo: CustomerRepository,
    ) { }

    async execute(companyId: string, search?: string, page = 1, limit = 20) {
        const result = await this.repo.findAll(companyId, search, page, limit);
        return { data: result.data.map(toCustomerResponse), total: result.total };
    }
}

@Injectable()
export class GetCustomerByIdUseCase {
    constructor(
        @Inject(TOKENS.CUSTOMER_REPOSITORY) private readonly repo: CustomerRepository,
    ) { }

    async execute(id: string, companyId: string): Promise<CustomerResponseDto> {
        const customer = await this.repo.findById(id, companyId);
        if (!customer) throw new NotFoundException('Customer');
        return toCustomerResponse(customer);
    }
}
