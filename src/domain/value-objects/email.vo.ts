import { DomainException } from '@shared/exceptions/domain.exception';

export class Email {
    private readonly value: string;

    private constructor(email: string) {
        const normalized = email.trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
            throw new DomainException(`Invalid email format: "${email}"`);
        }
        this.value = normalized;
    }

    static create(email: string): Email {
        return new Email(email);
    }

    get raw(): string {
        return this.value;
    }

    equals(other: Email): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }
}
