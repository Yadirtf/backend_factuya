import { Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from '@domain/repositories/user.repository';
import { CompanyRepository } from '@domain/repositories/company.repository';
import { Company } from '@domain/entities/company.entity';
import { User } from '@domain/entities/user.entity';
import { UserRole } from '@domain/enums/user-role.enum';
import { LoginDto, TokenResponseDto, RegisterCompanyDto } from '../../dtos/auth/auth.dto';
import { TOKENS } from '@shared/constants/tokens';
import { UnauthorizedException } from '@shared/exceptions/unauthorized.exception';
import { DomainException } from '@shared/exceptions/domain.exception';

export interface JwtPayload {
    sub: string;
    companyId: string;
    role: UserRole;
    email: string;
}

@Injectable()
export class LoginUseCase {
    constructor(
        @Inject(TOKENS.USER_REPOSITORY) private readonly userRepo: UserRepository,
        private readonly jwtService: JwtService,
        private readonly config: ConfigService,
    ) { }

    async execute(dto: LoginDto): Promise<TokenResponseDto> {
        const user = await this.userRepo.findByEmailGlobal(dto.email);
        if (!user || !user.isActive) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload: JwtPayload = {
            sub: user.id,
            companyId: user.companyId,
            role: user.role,
            email: user.email.raw,
        };

        const accessToken = this.jwtService.sign(payload, {
            secret: this.config.get('JWT_SECRET'),
            expiresIn: this.config.get('JWT_EXPIRATION', '15m'),
        });

        const refreshToken = this.jwtService.sign(payload, {
            secret: this.config.get('JWT_REFRESH_SECRET'),
            expiresIn: this.config.get('JWT_REFRESH_EXPIRATION', '7d'),
        });

        const hashedRefresh = await bcrypt.hash(refreshToken, 10);
        await this.userRepo.updateRefreshToken(user.id, hashedRefresh);

        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email.raw,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                companyId: user.companyId,
            },
        };
    }
}

@Injectable()
export class RegisterCompanyUseCase {
    constructor(
        @Inject(TOKENS.COMPANY_REPOSITORY) private readonly companyRepo: CompanyRepository,
        @Inject(TOKENS.USER_REPOSITORY) private readonly userRepo: UserRepository,
    ) { }

    async execute(dto: RegisterCompanyDto): Promise<{ companyId: string; userId: string }> {
        const existing = await this.companyRepo.findByNit(dto.nit);
        if (existing) {
            throw new DomainException(`Company with NIT ${dto.nit} already exists`);
        }

        const company = Company.create({
            id: uuidv4(),
            nit: dto.nit,
            businessName: dto.businessName,
            email: dto.email,
            address: dto.address,
            city: dto.city,
            department: dto.department,
            taxRegime: dto.taxRegime,
            economicActivity: dto.economicActivity,
            phone: dto.phone,
            tradeName: dto.tradeName,
        });
        const savedCompany = await this.companyRepo.create(company);

        const passwordHash = await bcrypt.hash(dto.adminPassword, 12);
        const admin = User.create({
            id: uuidv4(),
            companyId: savedCompany.id,
            email: dto.adminEmail,
            passwordHash,
            firstName: dto.adminFirstName,
            lastName: dto.adminLastName,
            role: UserRole.ADMIN,
        });
        const savedUser = await this.userRepo.create(admin);

        return { companyId: savedCompany.id, userId: savedUser.id };
    }
}

@Injectable()
export class LogoutUseCase {
    constructor(
        @Inject(TOKENS.USER_REPOSITORY) private readonly userRepo: UserRepository,
    ) { }

    async execute(userId: string): Promise<void> {
        await this.userRepo.updateRefreshToken(userId, null);
    }
}

@Injectable()
export class CheckSetupUseCase {
    constructor(
        @Inject(TOKENS.USER_REPOSITORY) private readonly userRepo: UserRepository,
    ) { }

    async execute(): Promise<{ initialized: boolean }> {
        const count = await this.userRepo.countAdmins();
        return { initialized: count > 0 };
    }
}
