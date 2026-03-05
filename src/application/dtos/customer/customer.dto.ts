import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { DocumentType } from '@domain/enums/document-type.enum';

export class CreateCustomerDto {
    @IsEnum(DocumentType) documentType: DocumentType;
    @IsString() @IsNotEmpty() documentNumber: string;
    @IsString() @IsNotEmpty() firstName: string;
    @IsString() @IsNotEmpty() lastName: string;
    @IsString() @IsOptional() businessName?: string;
    @IsEmail() email: string;
    @IsString() @IsNotEmpty() phone: string;
    @IsString() @IsNotEmpty() address: string;
    @IsString() @IsNotEmpty() city: string;
    @IsString() @IsNotEmpty() department: string;
}

export class UpdateCustomerDto {
    @IsString() @IsOptional() businessName?: string;
    @IsEmail() @IsOptional() email?: string;
    @IsString() @IsOptional() phone?: string;
    @IsString() @IsOptional() address?: string;
    @IsString() @IsOptional() city?: string;
    @IsString() @IsOptional() department?: string;
}

export class CustomerResponseDto {
    id: string;
    companyId: string;
    documentType: DocumentType;
    documentNumber: string;
    firstName: string;
    lastName: string;
    displayName: string;
    businessName?: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    department: string;
    isActive: boolean;
}
