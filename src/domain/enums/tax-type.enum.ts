/** Tipos de impuesto según DIAN Colombia */
export enum TaxType {
    IVA = '01',      // Impuesto sobre las Ventas (0%, 5%, 19%)
    INC = '04',      // Impuesto Nacional al Consumo
    ICA = '03',      // Industria y Comercio
    RET_IVA = '05',  // Retención IVA
    RET_ICA = '06',  // Retención ICA
    RET_RENTA = '07',// Retención en la Fuente
}

export enum TaxRate {
    IVA_0 = 0,
    IVA_5 = 5,
    IVA_19 = 19,
    INC_8 = 8,
}
