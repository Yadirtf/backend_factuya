import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../http/guards/jwt-auth.guard';
import { RolesGuard } from '../http/guards/roles.guard';
import { Roles } from '../http/decorators/roles.decorator';
import { CurrentUser } from '../http/decorators/current-user.decorator';
import { JwtPayload } from '@application/use-cases/auth/auth.use-case';
import { UserRole } from '@domain/enums/user-role.enum';
import { GetCompanyUseCase, UpdateCompanyUseCase } from '@application/use-cases/company/company.use-case';
import { UploadCertificateUseCase } from '@application/use-cases/company/upload-certificate.use-case';
import { UpdateCompanyDto } from '@application/dtos/company/company.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';

@ApiTags('Company')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('company')
export class CompanyController {
    constructor(
        private readonly getCompany: GetCompanyUseCase,
        private readonly updateCompany: UpdateCompanyUseCase,
        private readonly uploadCertificateUseCase: UploadCertificateUseCase
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

    @Patch('certificate')
    @Roles(UserRole.ADMIN)
    @UseInterceptors(FileInterceptor('file'))
    async uploadCertificate(
        @UploadedFile() file: Express.Multer.File,
        @Body('password') password: string,
        @CurrentUser() user: JwtPayload
    ) {
        if (!file) {
            throw new BadRequestException('El archivo de certificado (.p12) es requerido');
        }
        if (!password) {
            throw new BadRequestException('La contraseña del certificado es requerida');
        }

        const cert = await this.uploadCertificateUseCase.execute({
            companyId: user.companyId,
            p12Buffer: file.buffer,
            password
        });

        return { message: 'Certificado subido correctamente', id: cert.id };
    }
}
