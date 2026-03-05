import { Email } from '../value-objects/email.vo';
import { UserRole } from '../enums/user-role.enum';
import { DomainException } from '@shared/exceptions/domain.exception';

export class User {
    private constructor(
        public readonly id: string,
        public readonly companyId: string,
        private _email: Email,
        private _passwordHash: string,
        private _firstName: string,
        private _lastName: string,
        private _role: UserRole,
        private _isActive: boolean,
        private _refreshToken: string | null,
        public readonly createdAt: Date,
        private _updatedAt: Date,
    ) { }

    static create(params: {
        id: string;
        companyId: string;
        email: string;
        passwordHash: string;
        firstName: string;
        lastName: string;
        role?: UserRole;
    }): User {
        if (!params.firstName?.trim() || !params.lastName?.trim()) {
            throw new DomainException('First and last name are required');
        }
        return new User(
            params.id,
            params.companyId,
            Email.create(params.email),
            params.passwordHash,
            params.firstName.trim(),
            params.lastName.trim(),
            params.role ?? UserRole.OPERATOR,
            true,
            null,
            new Date(),
            new Date(),
        );
    }

    static reconstitute(params: {
        id: string;
        companyId: string;
        email: string;
        passwordHash: string;
        firstName: string;
        lastName: string;
        role: UserRole;
        isActive: boolean;
        refreshToken: string | null;
        createdAt: Date;
        updatedAt: Date;
    }): User {
        return new User(
            params.id,
            params.companyId,
            Email.create(params.email),
            params.passwordHash,
            params.firstName,
            params.lastName,
            params.role,
            params.isActive,
            params.refreshToken,
            params.createdAt,
            params.updatedAt,
        );
    }

    get email(): Email { return this._email; }
    get passwordHash(): string { return this._passwordHash; }
    get firstName(): string { return this._firstName; }
    get lastName(): string { return this._lastName; }
    get fullName(): string { return `${this._firstName} ${this._lastName}`; }
    get role(): UserRole { return this._role; }
    get isActive(): boolean { return this._isActive; }
    get refreshToken(): string | null { return this._refreshToken; }
    get updatedAt(): Date { return this._updatedAt; }

    updateRole(role: UserRole): void {
        this._role = role;
        this._updatedAt = new Date();
    }

    updateRefreshToken(token: string | null): void {
        this._refreshToken = token;
        this._updatedAt = new Date();
    }

    deactivate(): void {
        this._isActive = false;
        this._refreshToken = null;
        this._updatedAt = new Date();
    }

    hasRole(...roles: UserRole[]): boolean {
        return roles.includes(this._role);
    }
}
