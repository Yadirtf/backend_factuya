import * as crypto from 'crypto';
import { Cufe } from '../value-objects/cufe.vo';
import { Invoice } from '../entities/invoice.entity';
import { TaxType } from '../enums/tax-type.enum';

/**
 * Servicio de dominio para calcular el CUFE (Código Único de Factura Electrónica).
 * Algoritmo oficial DIAN — Resolución 165/2023 Anexo Técnico v1.9
 *
 * Fórmula:
 * SHA-384(NumFac + FecFac + HorFac + ValFac + CodImp1 + ValImp1 + CodImp2 +
 *         ValImp2 + CodImp3 + ValImp3 + ValTol + NitOFE + NumAdq + ClaveT + TipAmb)
 */
export class CufeCalculatorService {
    calculate(invoice: Invoice, params: {
        nitOfe: string;       // NIT del emisor sin DV
        numAdq: string;       // Documento del adquiriente
        technicalKey: string; // Clave técnica de la resolución DIAN
        environment: '1' | '2'; // 1=Producción, 2=Pruebas
    }): Cufe {
        const fecFac = this.formatDate(invoice.issueDate);
        const horFac = this.formatTime(invoice.issueDate);
        const valFac = this.formatAmount(invoice.subtotal.value);

        // Obtener valores por tipo de impuesto
        const iva = this.getTaxTotal(invoice, TaxType.IVA);
        const inc = this.getTaxTotal(invoice, TaxType.INC);
        const ica = this.getTaxTotal(invoice, TaxType.ICA);

        const concat = [
            invoice.fullNumber,
            fecFac,
            horFac,
            valFac,
            TaxType.IVA,
            this.formatAmount(iva),
            TaxType.INC,
            this.formatAmount(inc),
            TaxType.ICA,
            this.formatAmount(ica),
            this.formatAmount(invoice.total.value),
            params.nitOfe,
            params.numAdq,
            params.technicalKey,
            params.environment,
        ].join('');

        const hash = crypto.createHash('sha384').update(concat, 'utf8').digest('hex');
        return Cufe.fromHash(hash);
    }

    private getTaxTotal(invoice: Invoice, taxType: TaxType): number {
        return invoice.items.reduce((total, item) => {
            const taxAmount = item.taxes
                .filter(t => t.type === taxType)
                .reduce((sum, t) => sum + t.amount.value, 0);
            return total + taxAmount;
        }, 0);
    }

    private formatDate(date: Date): string {
        return date.toISOString().split('T')[0]; // YYYY-MM-DD
    }

    private formatTime(date: Date): string {
        return date.toISOString().split('T')[1].slice(0, 8); // HH:MM:SS
    }

    private formatAmount(amount: number): string {
        return amount.toFixed(2); // Sin separadores de miles, punto decimal
    }
}
