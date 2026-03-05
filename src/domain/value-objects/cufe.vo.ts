import { DomainException } from '@shared/exceptions/domain.exception';

/**
 * Código Único de Factura Electrónica (CUFE) — 96 caracteres hexadecimales (SHA-384).
 * Resolución 165/2023 DIAN — Anexo Técnico v1.9
 */
export class Cufe {
    private readonly value: string;

    private constructor(hash: string) {
        if (hash.length !== 96) {
            throw new DomainException(`CUFE must be 96 hex chars (SHA-384), got ${hash.length}`);
        }
        if (!/^[a-f0-9]+$/i.test(hash)) {
            throw new DomainException('CUFE must contain only hexadecimal characters');
        }
        this.value = hash.toLowerCase();
    }

    static fromHash(hash: string): Cufe {
        return new Cufe(hash);
    }

    get raw(): string {
        return this.value;
    }

    equals(other: Cufe): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }
}
