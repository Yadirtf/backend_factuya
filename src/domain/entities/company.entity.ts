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
        private _dv: string,
        private _documentType: string,
        private _organizationType: number,
        private _businessName: string,
        private _email: Email,
        private _phone: string,
        private _address: string,
        private _postalCode: string,
        private _city: string,
        private _department: string,
        private _taxRegime: TaxRegime,
        private _taxResponsibilities: string[],
        private _economicActivity: string,
        private _mercantileRegistration: string,
        private _tradeName: string | undefined,
        private _dianConfig: DianConfig,
        private _isActive: boolean,
        public readonly createdAt: Date,
        private _updatedAt: Date,
    ) { }

    static create(params: {
        id: string;
        nit: string;
        dv: string;
        documentType: string;
        organizationType: number;
        businessName: string;
        email: string;
        phone: string;
        address: string;
        postalCode: string;
        city: string;
        department: string;
        taxRegime: TaxRegime;
        taxResponsibilities: string[];
        economicActivity: string;
        mercantileRegistration: string;
        tradeName?: string;
    }): Company {
        if (!params.businessName || params.businessName.trim().length < 3) {
            throw new DomainException('Business name must be at least 3 characters');
        }
        return new Company(
            params.id,
            Nit.create(params.nit),
            params.dv,
            params.documentType,
            params.organizationType,
            params.businessName.trim(),
            Email.create(params.email),
            params.phone,
            params.address,
            params.postalCode,
            params.city,
            params.department,
            params.taxRegime,
            params.taxResponsibilities,
            params.economicActivity,
            params.mercantileRegistration,
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
        dv: string;
        documentType: string;
        organizationType: number;
        businessName: string;
        email: string;
        phone: string;
        address: string;
        postalCode: string;
        city: string;
        department: string;
        taxRegime: TaxRegime;
        taxResponsibilities: string[];
        economicActivity: string;
        mercantileRegistration: string;
        tradeName?: string;
        dianConfig: DianConfig;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }): Company {
        return new Company(
            params.id,
            Nit.create(params.nit),
            params.dv,
            params.documentType,
            params.organizationType,
            params.businessName,
            Email.create(params.email),
            params.phone,
            params.address,
            params.postalCode,
            params.city,
            params.department,
            params.taxRegime,
            params.taxResponsibilities,
            params.economicActivity,
            params.mercantileRegistration,
            params.tradeName,
            params.dianConfig,
            params.isActive,
            params.createdAt,
            params.updatedAt,
        );
    }

    get nit(): Nit { return this._nit; }
    get dv(): string { return this._dv; }
    get documentType(): string { return this._documentType; }
    get organizationType(): number { return this._organizationType; }
    get businessName(): string { return this._businessName; }
    get email(): Email { return this._email; }
    get phone(): string { return this._phone; }
    get address(): string { return this._address; }
    get postalCode(): string { return this._postalCode; }
    get city(): string { return this._city; }
    get department(): string { return this._department; }
    get taxRegime(): TaxRegime { return this._taxRegime; }
    get taxResponsibilities(): string[] { return this._taxResponsibilities; }
    get economicActivity(): string { return this._economicActivity; }
    get mercantileRegistration(): string { return this._mercantileRegistration; }
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
        postalCode?: string;
        city?: string;
        department?: string;
        phone?: string;
        taxResponsibilities?: string[];
        economicActivity?: string;
        mercantileRegistration?: string;
        isActive?: boolean;
    }): void {
        if (params.businessName) this._businessName = params.businessName;
        if (params.tradeName !== undefined) this._tradeName = params.tradeName;
        if (params.address) this._address = params.address;
        if (params.postalCode) this._postalCode = params.postalCode;
        if (params.city) this._city = params.city;
        if (params.department) this._department = params.department;
        if (params.phone) this._phone = params.phone;
        if (params.taxResponsibilities) this._taxResponsibilities = params.taxResponsibilities;
        if (params.economicActivity) this._economicActivity = params.economicActivity;
        if (params.mercantileRegistration) this._mercantileRegistration = params.mercantileRegistration;
        if (params.isActive !== undefined) this._isActive = params.isActive;
        this._updatedAt = new Date();
    }

    deactivate(): void {
        this._isActive = false;
        this._updatedAt = new Date();
    }

    toJSON() {
        return {
            id: this.id,
            nit: { raw: this.nit.raw, checkDigit: this.nit.checkDigit },
            dv: this.dv,
            documentType: this.documentType,
            organizationType: this.organizationType,
            businessName: this.businessName,
            email: { raw: this.email.raw },
            phone: this.phone,
            address: this.address,
            postalCode: this.postalCode,
            city: this.city,
            department: this.department,
            taxRegime: this.taxRegime,
            taxResponsibilities: this.taxResponsibilities,
            economicActivity: this.economicActivity,
            mercantileRegistration: this.mercantileRegistration,
            tradeName: this.tradeName,
            dianConfig: this.dianConfig,
            isActive: this.isActive,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}
