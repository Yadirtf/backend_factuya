import { DomainException } from '@shared/exceptions/domain.exception';

/**
 * Representa un valor monetario en COP.
 * Internamente trabaja en centavos para evitar errores de punto flotante.
 */
export class Money {
    private readonly cents: number;
    private readonly currency: string;

    private constructor(cents: number, currency = 'COP') {
        if (!Number.isFinite(cents)) throw new DomainException('Invalid money amount');
        if (cents < 0) throw new DomainException('Money cannot be negative');
        this.cents = Math.round(cents);
        this.currency = currency;
    }

    /** Crea Money desde un valor decimal (ej: 1000.50 → 100050 centavos) */
    static of(amount: number, currency = 'COP'): Money {
        return new Money(Math.round(amount * 100), currency);
    }

    /** Crea Money desde centavos directamente */
    static fromCents(cents: number, currency = 'COP'): Money {
        return new Money(cents, currency);
    }

    static zero(): Money {
        return new Money(0);
    }

    get value(): number {
        return this.cents / 100;
    }

    get asCents(): number {
        return this.cents;
    }

    get currencyCode(): string {
        return this.currency;
    }

    add(other: Money): Money {
        this.assertSameCurrency(other);
        return Money.fromCents(this.cents + other.cents, this.currency);
    }

    subtract(other: Money): Money {
        this.assertSameCurrency(other);
        if (this.cents < other.cents) throw new DomainException('Cannot subtract: result would be negative');
        return Money.fromCents(this.cents - other.cents, this.currency);
    }

    multiply(factor: number): Money {
        if (factor < 0) throw new DomainException('Multiply factor cannot be negative');
        return Money.fromCents(Math.round(this.cents * factor), this.currency);
    }

    percentage(percent: number): Money {
        return Money.fromCents(Math.round(this.cents * (percent / 100)), this.currency);
    }

    equals(other: Money): boolean {
        return this.cents === other.cents && this.currency === other.currency;
    }

    format(): string {
        return `${this.currency} ${this.value.toLocaleString('es-CO', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    }

    toJSON(): { amount: number; currency: string } {
        return { amount: this.value, currency: this.currency };
    }

    private assertSameCurrency(other: Money): void {
        if (this.currency !== other.currency) {
            throw new DomainException(`Currency mismatch: ${this.currency} vs ${other.currency}`);
        }
    }
}
