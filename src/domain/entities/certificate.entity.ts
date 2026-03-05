import { DomainException } from '@shared/exceptions/domain.exception';

export class Certificate {
    private constructor(
        public readonly id: string,
        public readonly companyId: string,
        private _encryptedP12: string,
        private _encryptionIV: string,
        private _certPassword: string,  // Almacenado encriptado, NUNCA en texto plano en BD
        private _validFrom: Date,
        private _validTo: Date,
        private _issuedBy: string,
        private _isActive: boolean,
        public readonly uploadedAt: Date,
    ) { }

    static create(params: {
        id: string;
        companyId: string;
        encryptedP12: string;
        encryptionIV: string;
        certPassword: string;
        validFrom: Date;
        validTo: Date;
        issuedBy: string;
    }): Certificate {
        if (!params.encryptedP12) {
            throw new DomainException('Encrypted P12 content is required');
        }
        if (params.validTo < new Date()) {
            throw new DomainException('Certificate is expired');
        }
        return new Certificate(
            params.id, params.companyId, params.encryptedP12, params.encryptionIV,
            params.certPassword, params.validFrom, params.validTo, params.issuedBy,
            true, new Date(),
        );
    }

    static reconstitute(params: {
        id: string;
        companyId: string;
        encryptedP12: string;
        encryptionIV: string;
        certPassword: string;
        validFrom: Date;
        validTo: Date;
        issuedBy: string;
        isActive: boolean;
        uploadedAt: Date;
    }): Certificate {
        return new Certificate(
            params.id, params.companyId, params.encryptedP12, params.encryptionIV,
            params.certPassword, params.validFrom, params.validTo, params.issuedBy,
            params.isActive, params.uploadedAt,
        );
    }

    get encryptedP12(): string { return this._encryptedP12; }
    get encryptionIV(): string { return this._encryptionIV; }
    get certPassword(): string { return this._certPassword; }
    get validFrom(): Date { return this._validFrom; }
    get validTo(): Date { return this._validTo; }
    get issuedBy(): string { return this._issuedBy; }
    get isActive(): boolean { return this._isActive; }

    isExpired(): boolean {
        return this._validTo < new Date();
    }

    daysUntilExpiry(): number {
        const diff = this._validTo.getTime() - Date.now();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    deactivate(): void {
        this._isActive = false;
    }
}
