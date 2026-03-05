import { DomainException } from '@shared/exceptions/domain.exception';
import { TaxType } from '../enums/tax-type.enum';
import { Money } from './money.vo';

/**
 * Value Object que representa un impuesto aplicado a una línea o a la factura total.
 */
export class Tax {
    private constructor(
        private readonly _type: TaxType,
        private readonly _rate: number,     // Porcentaje (ej: 19 para IVA 19%)
        private readonly _base: Money,      // Base gravable
        private readonly _amount: Money,    // Valor del impuesto calculado
    ) { }

    static create(params: { type: TaxType; rate: number; base: Money }): Tax {
        if (params.rate < 0 || params.rate > 100) {
            throw new DomainException(`Invalid tax rate: ${params.rate}. Must be 0-100.`);
        }
        const amount = params.base.percentage(params.rate);
        return new Tax(params.type, params.rate, params.base, amount);
    }

    /** Crea un impuesto con base y monto ya calculados (para reconstrucción desde BD) */
    static reconstitute(params: { type: TaxType; rate: number; base: Money; amount: Money }): Tax {
        return new Tax(params.type, params.rate, params.base, params.amount);
    }

    get type(): TaxType { return this._type; }
    get rate(): number { return this._rate; }
    get base(): Money { return this._base; }
    get amount(): Money { return this._amount; }

    /** Código DIAN del tipo de impuesto */
    get dianCode(): string { return this._type as string; }

    toJSON() {
        return {
            type: this._type,
            rate: this._rate,
            base: this._base.value,
            amount: this._amount.value,
        };
    }
}
