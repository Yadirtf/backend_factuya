import { DocumentType } from '../enums/document-type.enum';
import { Email } from '../value-objects/email.vo';

export class Customer {
    private constructor(
        public readonly id: string,
        public readonly companyId: string,
        private _documentType: DocumentType,
        private _documentNumber: string,
        private _firstName: string,
        private _lastName: string,
        private _businessName: string | undefined,
        private _email: Email,
        private _phone: string,
        private _address: string,
        private _city: string,
        private _department: string,
        private _isActive: boolean,
        public readonly createdAt: Date,
        private _updatedAt: Date,
    ) { }

    static create(params: {
        id: string;
        companyId: string;
        documentType: DocumentType;
        documentNumber: string;
        firstName: string;
        lastName: string;
        businessName?: string;
        email: string;
        phone: string;
        address: string;
        city: string;
        department: string;
    }): Customer {
        return new Customer(
            params.id,
            params.companyId,
            params.documentType,
            params.documentNumber.replace(/\D/g, ''),
            params.firstName.trim(),
            params.lastName.trim(),
            params.businessName?.trim(),
            Email.create(params.email),
            params.phone,
            params.address,
            params.city,
            params.department,
            true,
            new Date(),
            new Date(),
        );
    }

    static reconstitute(params: {
        id: string;
        companyId: string;
        documentType: DocumentType;
        documentNumber: string;
        firstName: string;
        lastName: string;
        businessName?: string;
        email: string;
        phone: string;
        address: string;
        city: string;
        department: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }): Customer {
        return new Customer(
            params.id, params.companyId, params.documentType, params.documentNumber,
            params.firstName, params.lastName, params.businessName,
            Email.create(params.email), params.phone, params.address, params.city,
            params.department, params.isActive, params.createdAt, params.updatedAt,
        );
    }

    get documentType(): DocumentType { return this._documentType; }
    get documentNumber(): string { return this._documentNumber; }
    get firstName(): string { return this._firstName; }
    get lastName(): string { return this._lastName; }
    get businessName(): string | undefined { return this._businessName; }
    get displayName(): string { return this._businessName ?? `${this._firstName} ${this._lastName}`; }
    get email(): Email { return this._email; }
    get phone(): string { return this._phone; }
    get address(): string { return this._address; }
    get city(): string { return this._city; }
    get department(): string { return this._department; }
    get isActive(): boolean { return this._isActive; }
    get updatedAt(): Date { return this._updatedAt; }
}
