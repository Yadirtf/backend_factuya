import { Controller, Get, Post, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../http/guards/jwt-auth.guard';
import { RolesGuard } from '../http/guards/roles.guard';
import { Roles } from '../http/decorators/roles.decorator';
import { CurrentUser } from '../http/decorators/current-user.decorator';
import { JwtPayload } from '@application/use-cases/auth/auth.use-case';
import { UserRole } from '@domain/enums/user-role.enum';
import { GetCompanyUseCase, UpdateCompanyUseCase, GetCompaniesUseCase, CreateCompanyUseCase } from '@application/use-cases/company/company.use-case';
import { UploadCertificateUseCase } from '@application/use-cases/company/upload-certificate.use-case';
import { UpdateCompanyDto, CreateCompanyDto } from '@application/dtos/company/company.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadedFile, UseInterceptors, BadRequestException, Param, Query } from '@nestjs/common';

@ApiTags('Company')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('company')
export class CompanyController {
    constructor(
        private readonly createCompany: CreateCompanyUseCase,
        private readonly getCompany: GetCompanyUseCase,
        private readonly getCompanies: GetCompaniesUseCase,
        private readonly updateCompany: UpdateCompanyUseCase,
        private readonly uploadCertificateUseCase: UploadCertificateUseCase
    ) { }

    @Post()
    @Roles(UserRole.SUPER_ADMIN)
    async create(@Body() dto: CreateCompanyDto) {
        return this.createCompany.execute(dto);
    }

    @Get()
    @Roles(UserRole.SUPER_ADMIN)
    findAll(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.getCompanies.execute(
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 50
        );
    }

    @Get('profile')
    @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
    getProfile(@CurrentUser() user: JwtPayload) {
        return this.getCompany.execute({ companyId: user.companyId });
    }

    @Get(':id')
    @Roles(UserRole.SUPER_ADMIN)
    getCompanyById(@Param('id') id: string) {
        return this.getCompany.execute({ companyId: id });
    }

    @Patch('profile')
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
    updateProfile(@Body() dto: UpdateCompanyDto, @CurrentUser() user: JwtPayload) {
        // Si es SUPER_ADMIN y se envía un companyId en el body, se permite actualizar ese. Si no, usa el del perfil actual.
        const targetCompanyId = (user.role === UserRole.SUPER_ADMIN && dto.companyId) ? dto.companyId : user.companyId;
        return this.updateCompany.execute({ ...dto, companyId: targetCompanyId });
    }

    @Patch('certificate')
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
    @UseInterceptors(FileInterceptor('file'))
    async uploadCertificate(
        @UploadedFile() file: Express.Multer.File,
        @Body('password') password: string,
        @Body('companyId') paramCompanyId: string,
        @CurrentUser() user: JwtPayload
    ) {
        if (!file) {
            throw new BadRequestException('El archivo de certificado (.p12) es requerido');
        }
        if (!password) {
            throw new BadRequestException('La contraseña del certificado es requerida');
        }

        const targetCompanyId = (user.role === UserRole.SUPER_ADMIN && paramCompanyId) ? paramCompanyId : user.companyId;

        const cert = await this.uploadCertificateUseCase.execute({
            companyId: targetCompanyId,
            p12Buffer: file.buffer,
            password
        });

        return { message: 'Certificado subido correctamente', id: cert.id };
    }
}
