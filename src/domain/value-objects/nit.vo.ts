import { DomainException } from '@shared/exceptions/domain.exception';

/**
 * Número de Identificación Tributaria (NIT) colombiano con validación de DV.
 */
export class Nit {
    private readonly value: string;
    private readonly dv: number;

    private constructor(nit: string) {
        const clean = nit.replace(/\D/g, '');
        if (!/^\d{8,10}$/.test(clean)) {
            throw new DomainException(`Invalid NIT format: "${nit}". Must be 8-10 digits.`);
        }
        this.value = clean;
        this.dv = Nit.calculateDV(clean);
    }

    static create(nit: string): Nit {
        return new Nit(nit);
    }

    /**
     * Algoritmo oficial DIAN para calcular el dígito de verificación del NIT.
     */
    static calculateDV(nit: string): number {
        const factors = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47];
        const digits = nit.split('').reverse().map(Number);
        const sum = digits.reduce((acc, digit, idx) => acc + digit * factors[idx], 0);
        const remainder = sum % 11;
        if (remainder === 0 || remainder === 1) return remainder;
        return 11 - remainder;
    }

    get raw(): string {
        return this.value;
    }

    get checkDigit(): number {
        return this.dv;
    }

    /** Formato con guion: 900123456-7 */
    get formatted(): string {
        return `${this.value}-${this.dv}`;
    }

    equals(other: Nit): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.formatted;
    }
}
