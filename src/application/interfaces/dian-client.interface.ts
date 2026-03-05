export interface DianResponse {
    isAccepted: boolean;
    statusCode: string;
    statusMessage: string;
    cufe?: string;
    qrCode?: string;
    rawResponse: string;
}

/** Puerto de salida: cliente DIAN (SOAP o Mock) */
export interface IDianClient {
    sendInvoice(input: { signedXml: string; companyNit: string; softwareId: string }): Promise<DianResponse>;
    getInvoiceStatus(cufe: string, companyNit: string): Promise<DianResponse>;
}
