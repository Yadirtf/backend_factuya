import { IsString, IsOptional, IsBoolean, IsObject, IsNotEmpty, IsEmail, IsEnum, Length, IsNumber, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCompanyDto {
    @IsString() @IsNotEmpty() nit: string;
    @IsString() @Length(1, 1) dv: string;
    @IsNumber() @IsNotEmpty() organizationType: number;
    @IsString() @IsNotEmpty() documentType: string;
    @IsString() @IsNotEmpty() businessName: string;
    @IsString() @IsOptional() tradeName?: string;
    @IsEmail() @IsOptional() email?: string;
    @IsString() @IsNotEmpty() phone: string;
    @IsString() @IsNotEmpty() address: string;
    @IsString() @Length(6, 6) postalCode: string;
    @IsString() @IsNotEmpty() city: string;
    @IsString() @IsNotEmpty() department: string;
    @IsString() @IsNotEmpty() economicActivity: string;
    @IsEnum(['SIMPLIFIED', 'COMMON']) taxRegime: 'SIMPLIFIED' | 'COMMON' = 'COMMON';
    @IsArray() @IsString({ each: true }) @IsNotEmpty() taxResponsibilities: string[];
    @IsString() @IsNotEmpty() mercantileRegistration: string;
}
export class UpdateCompanyDto {
    @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 1) dv?: string;
    @ApiPropertyOptional() @IsOptional() @IsNumber() organizationType?: number;
    @ApiPropertyOptional() @IsOptional() @IsString() documentType?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() businessName?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() tradeName?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() address?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() @Length(6, 6) postalCode?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() department?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
    @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) taxResponsibilities?: string[];
    @ApiPropertyOptional() @IsOptional() @IsString() mercantileRegistration?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() economicActivity?: string;

    @ApiPropertyOptional({ description: 'Configuraciones de la DIAN' })
    @IsOptional()
    @IsObject()
    dianConfig?: any;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiPropertyOptional({ description: 'Opcional, usado por SUPER_ADMIN para modificar datos de otra empresa' })
    @IsOptional()
    @IsString()
    companyId?: string;
}
