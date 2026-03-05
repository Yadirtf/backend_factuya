import { Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from '@domain/repositories/user.repository';
import { CompanyRepository } from '@domain/repositories/company.repository';
import { PersonRepository, RoleRepository } from '@domain/repositories/person-role.repository';
import { Company } from '@domain/entities/company.entity';
import { User } from '@domain/entities/user.entity';
import { Person } from '@domain/entities/person.entity';
import { Role, Permission } from '@domain/entities/role.entity';
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
    personId: string;
}

@Injectable()
export class LoginUseCase {
    constructor(
        @Inject(TOKENS.USER_REPOSITORY) private readonly userRepo: UserRepository,
        @Inject(TOKENS.PERSON_REPOSITORY) private readonly personRepo: PersonRepository,
        @Inject(TOKENS.ROLE_REPOSITORY) private readonly roleRepo: RoleRepository,
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

        const person = await this.personRepo.findById(user.personId, user.companyId);
        const role = await this.roleRepo.findById(user.roleId, user.companyId);

        if (!person || !role) {
            throw new DomainException('User profile or role not found');
        }

        const payload: JwtPayload = {
            sub: user.id,
            companyId: user.companyId,
            role: role.code as any as UserRole,
            email: user.email.raw,
            personId: person.id,
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
                firstName: person.firstName,
                lastName: person.lastName,
                role: role.code as any, // Mantener compatibilidad con DTO si usa enum
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
        @Inject(TOKENS.PERSON_REPOSITORY) private readonly personRepo: PersonRepository,
        @Inject(TOKENS.ROLE_REPOSITORY) private readonly roleRepo: RoleRepository,
    ) { }

    async execute(dto: RegisterCompanyDto): Promise<{ companyId: string; userId: string }> {
        const existing = await this.companyRepo.findByNit(dto.nit);
        if (existing) {
            throw new DomainException(`Company with NIT ${dto.nit} already exists`);
        }

        // 1. Crear Compañía
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

        // 2. Crear Rol Admin para la Compañía
        const adminRole = Role.create({
            id: uuidv4(),
            companyId: savedCompany.id,
            name: 'Administrador',
            code: 'ADMIN',
            permissions: Object.values(Permission), // Full permissions for initial admin
        });
        const savedRole = await this.roleRepo.create(adminRole);

        // 3. Crear Persona para el Admin
        const person = Person.create({
            id: uuidv4(),
            companyId: savedCompany.id,
            firstName: dto.adminFirstName,
            lastName: dto.adminLastName,
        });
        const savedPerson = await this.personRepo.create(person);

        // 4. Crear Usuario (Credenciales)
        const passwordHash = await bcrypt.hash(dto.adminPassword, 12);
        const user = User.create({
            id: uuidv4(),
            companyId: savedCompany.id,
            personId: savedPerson.id,
            roleId: savedRole.id,
            email: dto.adminEmail,
            passwordHash,
        });
        const savedUser = await this.userRepo.create(user);

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
