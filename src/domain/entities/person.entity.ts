export class Person {
    private constructor(
        public readonly id: string,
        public readonly companyId: string,
        private _firstName: string,
        private _lastName: string,
        private _phone: string | null,
        public readonly createdAt: Date,
        private _updatedAt: Date,
    ) { }

    static create(params: {
        id: string;
        companyId: string;
        firstName: string;
        lastName: string;
        phone?: string;
    }): Person {
        return new Person(
            params.id,
            params.companyId,
            params.firstName.trim(),
            params.lastName.trim(),
            params.phone ?? null,
            new Date(),
            new Date(),
        );
    }

    static reconstitute(params: {
        id: string;
        companyId: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
    }): Person {
        return new Person(
            params.id,
            params.companyId,
            params.firstName,
            params.lastName,
            params.phone,
            params.createdAt,
            params.updatedAt,
        );
    }

    get firstName(): string { return this._firstName; }
    get lastName(): string { return this._lastName; }
    get fullName(): string { return `${this._firstName} ${this._lastName}`; }
    get phone(): string | null { return this._phone; }
    get updatedAt(): Date { return this._updatedAt; }

    updateInfo(params: { firstName?: string; lastName?: string; phone?: string }): void {
        if (params.firstName) this._firstName = params.firstName.trim();
        if (params.lastName) this._lastName = params.lastName.trim();
        if (params.phone !== undefined) this._phone = params.phone;
        this._updatedAt = new Date();
    }
}
