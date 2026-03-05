import { Email } from '../value-objects/email.vo';
import { DomainException } from '@shared/exceptions/domain.exception';

export class User {
    private constructor(
        public readonly id: string,
        public readonly companyId: string,
        public readonly personId: string,
        public readonly roleId: string,
        private _email: Email, // Mantener email para búsqueda rápida/login
        private _passwordHash: string,
        private _isActive: boolean,
        private _refreshToken: string | null,
        public readonly createdAt: Date,
        private _updatedAt: Date,
    ) { }

    static create(params: {
        id: string;
        companyId: string;
        personId: string;
        roleId: string;
        email: string;
        passwordHash: string;
    }): User {
        return new User(
            params.id,
            params.companyId,
            params.personId,
            params.roleId,
            Email.create(params.email),
            params.passwordHash,
            true,
            null,
            new Date(),
            new Date(),
        );
    }

    static reconstitute(params: {
        id: string;
        companyId: string;
        personId: string;
        roleId: string;
        email: string;
        passwordHash: string;
        isActive: boolean;
        refreshToken: string | null;
        createdAt: Date;
        updatedAt: Date;
    }): User {
        return new User(
            params.id,
            params.companyId,
            params.personId,
            params.roleId,
            Email.create(params.email),
            params.passwordHash,
            params.isActive,
            params.refreshToken,
            params.createdAt,
            params.updatedAt,
        );
    }

    get email(): Email { return this._email; }
    get passwordHash(): string { return this._passwordHash; }
    get personId_ref(): string { return this.personId; }
    get roleId_ref(): string { return this.roleId; }
    get isActive(): boolean { return this._isActive; }
    get refreshToken(): string | null { return this._refreshToken; }
    get updatedAt(): Date { return this._updatedAt; }

    updateRefreshToken(token: string | null): void {
        this._refreshToken = token;
        this._updatedAt = new Date();
    }

    updateRole(roleId: string): void {
        (this as any).roleId = roleId; // Update the readonly property via casting if needed or change the prop to private with getter
        this._updatedAt = new Date();
    }

    deactivate(): void {
        this._isActive = false;
        this._refreshToken = null;
        this._updatedAt = new Date();
    }
}
