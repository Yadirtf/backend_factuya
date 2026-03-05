import { DomainException } from '@shared/exceptions/domain.exception';
import { Nit } from '../value-objects/nit.vo';
import { Email } from '../value-objects/email.vo';

export type TaxRegime = 'SIMPLIFIED' | 'COMMON';

export interface DianConfig {
    softwareId?: string;
    softwarePin?: string;
    testSetId?: string;
    resolutionNumber?: string;
    resolutionDate?: Date;
    invoicePrefix?: string;
    invoiceRangeFrom?: number;
    invoiceRangeTo?: number;
    technicalKey?: string;
    isTestEnvironment: boolean;
}

export class Company {
    private constructor(
        public readonly id: string,
        private _nit: Nit,
        private _businessName: string,
        private _email: Email,
        private _address: string,
        private _city: string,
        private _department: string,
        private _taxRegime: TaxRegime,
        private _economicActivity: string,
        private _phone: string,
        private _tradeName: string | undefined,
        private _dianConfig: DianConfig,
        private _isActive: boolean,
        public readonly createdAt: Date,
        private _updatedAt: Date,
    ) { }

    static create(params: {
        id: string;
        nit: string;
        businessName: string;
        email: string;
        address: string;
        city: string;
        department: string;
        taxRegime: TaxRegime;
        economicActivity: string;
        phone: string;
        tradeName?: string;
    }): Company {
        if (!params.businessName || params.businessName.trim().length < 3) {
            throw new DomainException('Business name must be at least 3 characters');
        }
        return new Company(
            params.id,
            Nit.create(params.nit),
            params.businessName.trim(),
            Email.create(params.email),
            params.address,
            params.city,
            params.department,
            params.taxRegime,
            params.economicActivity,
            params.phone,
            params.tradeName,
            { isTestEnvironment: true },
            true,
            new Date(),
            new Date(),
        );
    }

    static reconstitute(params: {
        id: string;
        nit: string;
        businessName: string;
        email: string;
        address: string;
        city: string;
        department: string;
        taxRegime: TaxRegime;
        economicActivity: string;
        phone: string;
        tradeName?: string;
        dianConfig: DianConfig;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }): Company {
        return new Company(
            params.id,
            Nit.create(params.nit),
            params.businessName,
            Email.create(params.email),
            params.address,
            params.city,
            params.department,
            params.taxRegime,
            params.economicActivity,
            params.phone,
            params.tradeName,
            params.dianConfig,
            params.isActive,
            params.createdAt,
            params.updatedAt,
        );
    }

    get nit(): Nit { return this._nit; }
    get businessName(): string { return this._businessName; }
    get email(): Email { return this._email; }
    get address(): string { return this._address; }
    get city(): string { return this._city; }
    get department(): string { return this._department; }
    get taxRegime(): TaxRegime { return this._taxRegime; }
    get economicActivity(): string { return this._economicActivity; }
    get phone(): string { return this._phone; }
    get tradeName(): string | undefined { return this._tradeName; }
    get dianConfig(): DianConfig { return this._dianConfig; }
    get isActive(): boolean { return this._isActive; }
    get updatedAt(): Date { return this._updatedAt; }

    updateDianConfig(config: Partial<DianConfig>): void {
        this._dianConfig = { ...this._dianConfig, ...config };
        this._updatedAt = new Date();
    }

    updateProfile(params: {
        businessName?: string;
        tradeName?: string;
        address?: string;
        city?: string;
        department?: string;
        phone?: string;
        economicActivity?: string;
        isActive?: boolean;
    }): void {
        if (params.businessName) this._businessName = params.businessName;
        if (params.tradeName !== undefined) this._tradeName = params.tradeName;
        if (params.address) this._address = params.address;
        if (params.city) this._city = params.city;
        if (params.department) this._department = params.department;
        if (params.phone) this._phone = params.phone;
        if (params.economicActivity) this._economicActivity = params.economicActivity;
        if (params.isActive !== undefined) this._isActive = params.isActive;
        this._updatedAt = new Date();
    }

    deactivate(): void {
        this._isActive = false;
        this._updatedAt = new Date();
    }
}
