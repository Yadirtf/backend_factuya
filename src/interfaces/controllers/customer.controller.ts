import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../http/guards/jwt-auth.guard';
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
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customers')
export class CustomerController {
    constructor(
        private readonly createCustomer: CreateCustomerUseCase,
        private readonly getCustomers: GetCustomersUseCase,
        private readonly getCustomerById: GetCustomerByIdUseCase,
    ) { }

    @Post()
    @Roles(UserRole.ADMIN, UserRole.OPERATOR)
    create(@Body() dto: CreateCustomerDto, @CurrentUser() user: JwtPayload) {
        return this.createCustomer.execute(dto, user.companyId);
    }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.OPERATOR, UserRole.ACCOUNTANT)
    findAll(
        @CurrentUser() user: JwtPayload,
        @Query('search') search?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.getCustomers.execute(
            user.companyId,
            search,
            page ? parseInt(page, 10) : 1,
            limit ? parseInt(limit, 10) : 20
        );
    }

    @Get(':id')
    @Roles(UserRole.ADMIN, UserRole.OPERATOR, UserRole.ACCOUNTANT)
    findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
        return this.getCustomerById.execute(id, user.companyId);
    }
}
