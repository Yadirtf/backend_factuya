import {
    IsArray, IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional,
    IsPositive, IsString, Min, ValidateNested, ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InvoiceType } from '@domain/enums/invoice-type.enum';
import { InvoiceStatus } from '@domain/enums/invoice-status.enum';
import { TaxType } from '@domain/enums/tax-type.enum';

export class InvoiceTaxDto {
    @IsEnum(TaxType) type: TaxType;
    @IsNumber() @Min(0) rate: number;
}

export class InvoiceItemDto {
    @IsString() @IsNotEmpty() productCode: string;
    @IsString() @IsNotEmpty() description: string;
    @IsNumber() @IsPositive() quantity: number;
    @IsNumber() @IsPositive() unitPrice: number;        // En pesos COP
    @IsNumber() @Min(0) discount: number;               // En pesos COP
    @IsArray() @ValidateNested({ each: true }) @Type(() => InvoiceTaxDto)
    taxes: InvoiceTaxDto[];
}

export class CreateInvoiceDto {
    @IsEnum(InvoiceType) type: InvoiceType;
    @IsString() @IsNotEmpty() customerId: string;
    @IsDateString() issueDate: string;
    @IsDateString() @IsOptional() dueDate?: string;
    @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => InvoiceItemDto)
    items: InvoiceItemDto[];
    @IsString() @IsOptional() notes?: string;
}

export class InvoiceItemResponseDto {
    id: string;
    productCode: string;
    description: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    subtotal: number;
    totalTax: number;
    total: number;
    taxes: { type: TaxType; rate: number; base: number; amount: number }[];
}

export class InvoiceResponseDto {
    id: string;
    companyId: string;
    number: string;
    prefix: string;
    fullNumber: string;
    type: InvoiceType;
    status: InvoiceStatus;
    customerId: string;
    items: InvoiceItemResponseDto[];
    subtotal: number;
    totalTax: number;
    total: number;
    cufe?: string;
    qrCode?: string;
    issueDate: Date;
    dueDate?: Date;
    notes?: string;
    dianResponse?: string;
    createdAt: Date;
    updatedAt: Date;
}

export class InvoiceListResponseDto {
    data: InvoiceResponseDto[];
    total: number;
    page: number;
    limit: number;
}
