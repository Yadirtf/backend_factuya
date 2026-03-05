import {
    IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength,
} from 'class-validator';
import { UserRole } from '@domain/enums/user-role.enum';

export class CreateUserDto {
    @IsEmail() email: string;
    @IsString() @MinLength(8) password: string;
    @IsString() @IsNotEmpty() firstName: string;
    @IsString() @IsNotEmpty() lastName: string;
    @IsEnum(UserRole) @IsOptional() role?: UserRole;
    @IsString() @IsOptional() roleId?: string;
}

export class UpdateUserRoleDto {
    @IsEnum(UserRole) @IsOptional() role?: UserRole;
    @IsString() @IsOptional() roleId?: string;
}

export class UserResponseDto {
    id: string;
    companyId: string;
    email: string;
    firstName: string;
    lastName: string;
    fullName: string;
    role: UserRole;
    isActive: boolean;
    createdAt: Date;
}
