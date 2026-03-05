import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';

export class LoginDto {
    @IsEmail()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}

export class TokenResponseDto {
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        companyId: string;
    };
}

export class RefreshTokenDto {
    @IsString()
    @IsNotEmpty()
    refreshToken: string;
}

export class RegisterCompanyDto {
    @IsString() @IsNotEmpty() nit: string;
    @IsString() @IsNotEmpty() businessName: string;
    @IsString() @IsOptional() tradeName?: string;
    @IsEmail() email: string;
    @IsString() @IsNotEmpty() phone: string;
    @IsString() @IsNotEmpty() address: string;
    @IsString() @IsNotEmpty() city: string;
    @IsString() @IsNotEmpty() department: string;
    @IsString() @IsNotEmpty() economicActivity: string;
    @IsEnum(['SIMPLIFIED', 'COMMON']) taxRegime: 'SIMPLIFIED' | 'COMMON' = 'COMMON';
    // Admin del sistema
    @IsString() @IsNotEmpty() adminFirstName: string;
    @IsString() @IsNotEmpty() adminLastName: string;
    @IsEmail() adminEmail: string;
    @IsString() @MinLength(8) adminPassword: string;
}
