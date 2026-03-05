export enum Permission {
    // Invoices
    CREATE_INVOICE = 'CREATE_INVOICE',
    VIEW_INVOICES = 'VIEW_INVOICES',
    CANCEL_INVOICE = 'CANCEL_INVOICE',
    SEND_TO_DIAN = 'SEND_TO_DIAN',

    // Customers
    CREATE_CUSTOMER = 'CREATE_CUSTOMER',
    VIEW_CUSTOMERS = 'VIEW_CUSTOMERS',
    EDIT_CUSTOMER = 'EDIT_CUSTOMER',

    // Company
    EDIT_COMPANY = 'EDIT_COMPANY',
    VIEW_COMPANY = 'VIEW_COMPANY',

    // Users & Roles
    MANAGE_USERS = 'MANAGE_USERS',
    MANAGE_ROLES = 'MANAGE_ROLES',
}

export class Role {
    private constructor(
        public readonly id: string,
        public readonly companyId: string,
        private _name: string,
        private _code: string,
        private _permissions: Permission[],
        public readonly createdAt: Date,
        private _updatedAt: Date,
    ) { }

    static create(params: {
        id: string;
        companyId: string;
        name: string;
        code: string;
        permissions?: Permission[];
    }): Role {
        return new Role(
            params.id,
            params.companyId,
            params.name,
            params.code.toUpperCase(),
            params.permissions ?? [],
            new Date(),
            new Date(),
        );
    }

    static reconstitute(params: {
        id: string;
        companyId: string;
        name: string;
        code: string;
        permissions: Permission[];
        createdAt: Date;
        updatedAt: Date;
    }): Role {
        return new Role(
            params.id,
            params.companyId,
            params.name,
            params.code,
            params.permissions,
            params.createdAt,
            params.updatedAt,
        );
    }

    get name(): string { return this._name; }
    get code(): string { return this._code; }
    get permissions(): Permission[] { return [...this._permissions]; }
    get updatedAt(): Date { return this._updatedAt; }

    updatePermissions(permissions: Permission[]): void {
        this._permissions = permissions;
        this._updatedAt = new Date();
    }

    addPermission(permission: Permission): void {
        if (!this._permissions.includes(permission)) {
            this._permissions.push(permission);
            this._updatedAt = new Date();
        }
    }

    hasPermission(permission: Permission): boolean {
        return this._permissions.includes(permission);
    }
}
