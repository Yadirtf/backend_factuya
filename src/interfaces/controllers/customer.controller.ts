import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { MainAuthGuard } from '../http/guards/main-auth.guard';
import { RolesGuard } from '../http/guards/roles.guard';
import { Roles } from '../http/decorators/roles.decorator';
import { CurrentUser } from '../http/decorators/current-user.decorator';
import { JwtPayload } from '@application/use-cases/auth/auth.use-case';
import { UserRole } from '@domain/enums/user-role.enum';
import { CreateCustomerUseCase } from '@application/use-cases/customer/customer.use-case';
import { GetCustomersUseCase } from '@application/use-cases/customer/customer.use-case';
import { GetCustomerByIdUseCase } from '@application/use-cases/customer/customer.use-case';
import { CreateCustomerDto } from '@application/dtos/customer/customer.dto';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(MainAuthGuard, RolesGuard)
@Controller('customers')
export class CustomerController {
    constructor(
        private readonly createCustomer: CreateCustomerUseCase,
        private readonly getCustomers: GetCustomersUseCase,
        private readonly getCustomerById: GetCustomerByIdUseCase,
    ) { }

    @Post()
    @Roles(UserRole.ADMIN, UserRole.OPERATOR, UserRole.SUPER_ADMIN)
    create(@Body() dto: CreateCustomerDto, @CurrentUser() user: JwtPayload) {
        const targetCompanyId = (user.role === UserRole.SUPER_ADMIN && dto.companyId) ? dto.companyId : user.companyId;
        return this.createCustomer.execute(dto, targetCompanyId);
    }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.OPERATOR, UserRole.ACCOUNTANT, UserRole.SUPER_ADMIN)
    findAll(
        @CurrentUser() user: JwtPayload,
        @Query('search') search?: string,
        @Query('companyId') paramCompanyId?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        const targetCompanyId = (user.role === UserRole.SUPER_ADMIN && paramCompanyId) ? paramCompanyId : user.companyId;
        return this.getCustomers.execute(
            targetCompanyId,
            search,
            page ? parseInt(page, 10) : 1,
            limit ? parseInt(limit, 10) : 20
        );
    }

    @Get(':id')
    @Roles(UserRole.ADMIN, UserRole.OPERATOR, UserRole.ACCOUNTANT, UserRole.SUPER_ADMIN)
    findOne(@Param('id') id: string, @Query('companyId') paramCompanyId: string, @CurrentUser() user: JwtPayload) {
        const targetCompanyId = user.role === UserRole.SUPER_ADMIN ? (paramCompanyId || null) : user.companyId;
        return this.getCustomerById.execute(id, targetCompanyId);
    }
}
