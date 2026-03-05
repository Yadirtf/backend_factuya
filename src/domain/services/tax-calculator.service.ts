import { Money } from '../value-objects/money.vo';
import { Tax } from '../value-objects/tax.vo';
import { TaxType, TaxRate } from '../enums/tax-type.enum';
import { DomainException } from '@shared/exceptions/domain.exception';

export interface TaxLineInput {
    taxType: TaxType;
    rate: TaxRate | number;
    baseAmount: Money;
}

/**
 * Servicio de dominio para calcular impuestos colombianos.
 * IVA (01), INC (04), ICA (03), Retenciones.
 */
export class TaxCalculatorService {
    calculateTaxes(lines: TaxLineInput[]): Tax[] {
        return lines.map(line => {
            this.validateRate(line.taxType, line.rate);
            return Tax.create({
                type: line.taxType,
                rate: line.rate,
                base: line.baseAmount,
            });
        });
    }

    calculateIva(baseAmount: Money, rate: TaxRate.IVA_0 | TaxRate.IVA_5 | TaxRate.IVA_19 = TaxRate.IVA_19): Tax {
        return Tax.create({ type: TaxType.IVA, rate, base: baseAmount });
    }

    calculateInc(baseAmount: Money, rate = TaxRate.INC_8): Tax {
        return Tax.create({ type: TaxType.INC, rate, base: baseAmount });
    }

    aggregateTaxes(taxes: Tax[]): Map<TaxType, Money> {
        const totals = new Map<TaxType, Money>();
        for (const tax of taxes) {
            const current = totals.get(tax.type) ?? Money.zero();
            totals.set(tax.type, current.add(tax.amount));
        }
        return totals;
    }

    private validateRate(taxType: TaxType, rate: number): void {
        const validRates: Record<TaxType, number[]> = {
            [TaxType.IVA]: [0, 5, 19],
            [TaxType.INC]: [4, 8, 16],
            [TaxType.ICA]: [], // Variable por municipio — cualquier valor positivo
            [TaxType.RET_IVA]: [0, 15],
            [TaxType.RET_ICA]: [],
            [TaxType.RET_RENTA]: [],
        };
        const allowed = validRates[taxType];
        if (allowed.length > 0 && !allowed.includes(rate)) {
            throw new DomainException(`Invalid rate ${rate}% for tax type ${taxType}. Allowed: ${allowed.join(', ')}`);
        }
    }
}
