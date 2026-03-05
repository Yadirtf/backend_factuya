import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../http/guards/jwt-auth.guard';
import { RolesGuard } from '../http/guards/roles.guard';
import { Roles } from '../http/decorators/roles.decorator';
import { CurrentUser } from '../http/decorators/current-user.decorator';
import { JwtPayload } from '@application/use-cases/auth/auth.use-case';
import { UserRole } from '@domain/enums/user-role.enum';
import { GetCompanyUseCase, UpdateCompanyUseCase } from '@application/use-cases/company/company.use-case';
import { UpdateCompanyDto } from '@application/dtos/company/company.dto';

@ApiTags('Company')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('company')
export class CompanyController {
    constructor(
        private readonly getCompany: GetCompanyUseCase,
        private readonly updateCompany: UpdateCompanyUseCase,
    ) { }

    @Get('profile')
    @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
    getProfile(@CurrentUser() user: JwtPayload) {
        return this.getCompany.execute({ companyId: user.companyId });
    }

    @Patch('profile')
    @Roles(UserRole.ADMIN)
    updateProfile(@Body() dto: UpdateCompanyDto, @CurrentUser() user: JwtPayload) {
        return this.updateCompany.execute({ ...dto, companyId: user.companyId });
    }
}
