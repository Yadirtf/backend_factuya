import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

export enum ApiKeyPermission {
    READ_INVOICES = 'READ_INVOICES',
    WRITE_INVOICES = 'WRITE_INVOICES',
    READ_CUSTOMERS = 'READ_CUSTOMERS',
    WRITE_CUSTOMERS = 'WRITE_CUSTOMERS',
}

export interface ApiKeyProps {
    id: string;
    companyId: string;
    name: string;
    key: string; // Hashed key
    secretPrefix: string; // First 8 chars for identification
    permissions: ApiKeyPermission[];
    isActive: boolean;
    lastUsedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export class ApiKey {
    private constructor(private readonly props: ApiKeyProps) { }

    get id(): string { return this.props.id; }
    get companyId(): string { return this.props.companyId; }
    get name(): string { return this.props.name; }
    get key(): string { return this.props.key; }
    get secretPrefix(): string { return this.props.secretPrefix; }
    get permissions(): ApiKeyPermission[] { return this.props.permissions; }
    get isActive(): boolean { return this.props.isActive; }
    get lastUsedAt(): Date | undefined { return this.props.lastUsedAt; }
    get createdAt(): Date { return this.props.createdAt; }
    get updatedAt(): Date { return this.props.updatedAt; }

    /**
     * Creates a new ApiKey and returns the raw secret (to be shown only once)
     */
    static create(props: {
        companyId: string;
        name: string;
        permissions?: ApiKeyPermission[];
    }): { apiKey: ApiKey; rawSecret: string } {
        const id = uuidv4();
        const rawSecret = `fy_${crypto.randomBytes(32).toString('hex')}`;
        const secretPrefix = rawSecret.substring(0, 8);

        // Hash the key for storage
        const hashedKey = crypto.createHash('sha256').update(rawSecret).digest('hex');

        const apiKey = new ApiKey({
            id,
            companyId: props.companyId,
            name: props.name,
            key: hashedKey,
            secretPrefix,
            permissions: props.permissions || [ApiKeyPermission.WRITE_INVOICES, ApiKeyPermission.READ_INVOICES],
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        return { apiKey, rawSecret };
    }

    static reconstruct(props: ApiKeyProps): ApiKey {
        return new ApiKey(props);
    }

    updateLastUsed(): void {
        this.props.lastUsedAt = new Date();
        this.props.updatedAt = new Date();
    }

    deactivate(): void {
        this.props.isActive = false;
        this.props.updatedAt = new Date();
    }

    hasPermission(permission: ApiKeyPermission): boolean {
        return this.props.permissions.includes(permission);
    }

    /**
     * Securely verify a raw secret against the stored hash
     */
    verifyKey(rawSecret: string): boolean {
        const hash = crypto.createHash('sha256').update(rawSecret).digest('hex');
        return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(this.props.key));
    }

    toJSON() {
        return {
            id: this.id,
            companyId: this.companyId,
            name: this.name,
            secretPrefix: this.secretPrefix,
            permissions: this.permissions,
            isActive: this.isActive,
            lastUsedAt: this.lastUsedAt,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}
