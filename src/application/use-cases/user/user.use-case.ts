import { Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { UserRepository } from '@domain/repositories/user.repository';
import { User } from '@domain/entities/user.entity';
import { UserRole } from '@domain/enums/user-role.enum';
import { CreateUserDto, UserResponseDto, UpdateUserRoleDto } from '../../dtos/user/user.dto';
import { TOKENS } from '@shared/constants/tokens';
import { NotFoundException } from '@shared/exceptions/not-found.exception';
import { DomainException } from '@shared/exceptions/domain.exception';

const toUserResponse = (user: User): UserResponseDto => ({
    id: user.id,
    companyId: user.companyId,
    email: user.email.raw,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
});

@Injectable()
export class CreateUserUseCase {
    constructor(
        @Inject(TOKENS.USER_REPOSITORY) private readonly userRepo: UserRepository,
    ) { }

    async execute(dto: CreateUserDto, companyId: string): Promise<UserResponseDto> {
        const existing = await this.userRepo.findByEmail(dto.email, companyId);
        if (existing) throw new DomainException(`User with email ${dto.email} already exists`);

        const passwordHash = await bcrypt.hash(dto.password, 12);
        const user = User.create({
            id: uuidv4(),
            companyId,
            email: dto.email,
            passwordHash,
            firstName: dto.firstName,
            lastName: dto.lastName,
            role: dto.role,
        });
        const saved = await this.userRepo.create(user);
        return toUserResponse(saved);
    }
}

@Injectable()
export class GetUsersUseCase {
    constructor(
        @Inject(TOKENS.USER_REPOSITORY) private readonly userRepo: UserRepository,
    ) { }

    async execute(companyId: string): Promise<UserResponseDto[]> {
        const users = await this.userRepo.findAll(companyId);
        return users.map(toUserResponse);
    }
}

@Injectable()
export class UpdateUserRoleUseCase {
    constructor(
        @Inject(TOKENS.USER_REPOSITORY) private readonly userRepo: UserRepository,
    ) { }

    async execute(userId: string, companyId: string, dto: UpdateUserRoleDto): Promise<UserResponseDto> {
        const user = await this.userRepo.findById(userId, companyId);
        if (!user) throw new NotFoundException('User');
        user.updateRole(dto.role);
        const updated = await this.userRepo.update(user);
        return toUserResponse(updated);
    }
}
