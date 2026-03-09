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

export class SetupSuperAdminDto {
    @IsString() @IsNotEmpty() adminFirstName: string;
    @IsString() @IsNotEmpty() adminLastName: string;
    @IsEmail() adminEmail: string;
    @IsString() @MinLength(8) adminPassword: string;
}
