import { Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { UserRepository } from '@domain/repositories/user.repository';
import { PersonRepository, RoleRepository } from '@domain/repositories/person-role.repository';
import { User } from '@domain/entities/user.entity';
import { Person } from '@domain/entities/person.entity';
import { Role } from '@domain/entities/role.entity';
import { CreateUserDto, UserResponseDto, UpdateUserRoleDto } from '../../dtos/user/user.dto';
import { TOKENS } from '@shared/constants/tokens';
import { NotFoundException } from '@shared/exceptions/not-found.exception';
import { DomainException } from '@shared/exceptions/domain.exception';

@Injectable()
export class CreateUserUseCase {
    constructor(
        @Inject(TOKENS.USER_REPOSITORY) private readonly userRepo: UserRepository,
        @Inject(TOKENS.PERSON_REPOSITORY) private readonly personRepo: PersonRepository,
        @Inject(TOKENS.ROLE_REPOSITORY) private readonly roleRepo: RoleRepository,
    ) { }

    async execute(dto: CreateUserDto, companyId: string): Promise<UserResponseDto> {
        const existing = await this.userRepo.findByEmail(dto.email, companyId);
        if (existing) throw new DomainException(`User with email ${dto.email} already exists`);

        // 1. Verificar si el rol existe (por ID o por código como fallback)
        let role: Role | null = null;
        if (dto.roleId) {
            role = await this.roleRepo.findById(dto.roleId, companyId);
        } else if (dto.role) {
            role = await this.roleRepo.findByCode(dto.role, companyId);
        }

        if (!role) throw new DomainException('Role not found');

        // 2. Crear Persona
        const person = Person.create({
            id: uuidv4(),
            companyId,
            firstName: dto.firstName,
            lastName: dto.lastName,
        });
        const savedPerson = await this.personRepo.create(person);

        // 3. Crear Usuario
        const passwordHash = await bcrypt.hash(dto.password, 12);
        const user = User.create({
            id: uuidv4(),
            companyId,
            personId: savedPerson.id,
            roleId: role.id,
            email: dto.email,
            passwordHash,
        });
        const savedUser = await this.userRepo.create(user);

        return {
            id: savedUser.id,
            companyId: savedUser.companyId,
            email: savedUser.email.raw,
            firstName: savedPerson.firstName,
            lastName: savedPerson.lastName,
            fullName: savedPerson.fullName,
            role: role.code as any, // Mapeo a enum para compatibilidad
            isActive: savedUser.isActive,
            createdAt: savedUser.createdAt,
        };
    }
}

@Injectable()
export class GetUsersUseCase {
    constructor(
        @Inject(TOKENS.USER_REPOSITORY) private readonly userRepo: UserRepository,
        @Inject(TOKENS.PERSON_REPOSITORY) private readonly personRepo: PersonRepository,
        @Inject(TOKENS.ROLE_REPOSITORY) private readonly roleRepo: RoleRepository,
    ) { }

    async execute(companyId: string): Promise<UserResponseDto[]> {
        const users = await this.userRepo.findAll(companyId);
        const responses: UserResponseDto[] = [];

        for (const user of users) {
            const person = await this.personRepo.findById(user.personId, companyId);
            const role = await this.roleRepo.findById(user.roleId, companyId);

            if (person && role) {
                responses.push({
                    id: user.id,
                    companyId: user.companyId,
                    email: user.email.raw,
                    firstName: person.firstName,
                    lastName: person.lastName,
                    fullName: person.fullName,
                    role: role.code as any,
                    isActive: user.isActive,
                    createdAt: user.createdAt,
                });
            }
        }

        return responses;
    }
}

@Injectable()
export class UpdateUserRoleUseCase {
    constructor(
        @Inject(TOKENS.USER_REPOSITORY) private readonly userRepo: UserRepository,
        @Inject(TOKENS.ROLE_REPOSITORY) private readonly roleRepo: RoleRepository,
    ) { }

    async execute(userId: string, companyId: string, dto: UpdateUserRoleDto): Promise<void> {
        const user = await this.userRepo.findById(userId, companyId);
        if (!user) throw new NotFoundException('User');

        // Buscar el rol por ID o por Código
        let role: Role | null = null;
        if (dto.roleId) {
            role = await this.roleRepo.findById(dto.roleId, companyId);
        } else if (dto.role) {
            role = await this.roleRepo.findByCode(dto.role, companyId);
        }

        if (!role) throw new DomainException('Role not found');

        user.updateRole(role.id);
        await this.userRepo.update(user);
    }
}
