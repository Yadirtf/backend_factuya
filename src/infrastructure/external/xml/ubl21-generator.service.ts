import { Injectable } from '@nestjs/common';
import { IXmlGenerator, GenerateXmlInput } from '@application/interfaces/xml-generator.interface';
import { Invoice } from '@domain/entities/invoice.entity';
import { Cufe } from '@domain/value-objects/cufe.vo';

@Injectable()
export class Ubl21GeneratorService implements IXmlGenerator {
    async generate(input: GenerateXmlInput): Promise<string> {
        const { invoice, cufe, companyData, customerData, environment } = input;

        // Formato básico de UBL 2.1 con la estructura requerida por DIAN V1.9
        const issueTime = invoice.issueDate.toISOString().split('T')[1].substring(0, 8) + '-05:00'; // Ajuste de timezone
        const issueDate = invoice.issueDate.toISOString().split('T')[0];

        const xml = `<? xml version = "1.0" encoding = "UTF-8" ?>
    <Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
xmlns: cac = "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
xmlns: cbc = "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
xmlns: ext = "urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2"
xmlns: sts = "dian:gov:co:facturaelectronica:Structures-2-1" >
    <ext: UBLExtensions >
        <ext: UBLExtension >
            <!--DIAN extension config-- >
                <ext: ExtensionContent >
                    <sts: DianExtensions >
                        <sts: InvoiceControl >
                            <sts: InvoiceAuthorization > 18760000001 </sts:InvoiceAuthorization>
                                < sts: AuthorizationPeriod >
                                    <cbc: StartDate > 2024-01-01 </cbc:StartDate>
                                        < cbc: EndDate > 2025-01-01 </cbc:EndDate>
                                            </sts:AuthorizationPeriod>
                                            < sts: AuthorizedInvoices >
                                                <sts: Prefix > ${invoice.prefix} </sts:Prefix>
                                                    < sts: From > 1 </sts:From>
                                                        < sts: To > 100000 </sts:To>
                                                            </sts:AuthorizedInvoices>
                                                            </sts:InvoiceControl>
                                                            < sts: InvoiceSource >
                                                                <cbc:IdentificationCode listAgencyID = "6" listAgencyName = "United Nations Economic Commission for Europe" listSchemeURI = "urn:oasis:names:specification:ubl:codelist:gc:CountryIdentificationCode-2.1" > CO </cbc:IdentificationCode>
                                                                    </sts:InvoiceSource>
                                                                    < sts: SoftwareProvider >
                                                                        <sts:ProviderID schemeAgencyID = "195" schemeAgencyName = "CO, DIAN (Direccion de Impuestos y Aduanas Nacionales)" schemeID = "4" schemeName = "${environment === '1' ? '1' : '31'}" > ${companyData.nit} </sts:ProviderID>
                                                                            < sts:SoftwareID schemeAgencyID = "195" schemeAgencyName = "CO, DIAN (Direccion de Impuestos y Aduanas Nacionales)" > ${companyData.softwareId} </sts:SoftwareID>
                                                                                </sts:SoftwareProvider>
                                                                                < sts:SoftwareSecurityCode schemeAgencyID = "195" schemeAgencyName = "CO, DIAN (Direccion de Impuestos y Aduanas Nacionales)" > ${companyData.technicalKey} </sts:SoftwareSecurityCode>
                                                                                    </sts:DianExtensions>
                                                                                    </ext:ExtensionContent>
                                                                                    </ext:UBLExtension>
                                                                                    < ext: UBLExtension >
                                                                                        <ext: ExtensionContent > </ext:ExtensionContent>
                                                                                            < !--XADES BES SIGNATURE GOES HERE IN EXTENSION CONTENT-- >
                                                                                                </ext:UBLExtension>
                                                                                                </ext:UBLExtensions>
                                                                                                < cbc: UBLVersionID > UBL 2.1 </cbc:UBLVersionID>
                                                                                                    < cbc: CustomizationID > 10 </cbc:CustomizationID>
                                                                                                        < cbc: ProfileExecutionID > 2 </cbc:ProfileExecutionID>
                                                                                                            < cbc: ID > ${invoice.prefix}${invoice.number} </cbc:ID>
                                                                                                                < cbc:UUID schemeID = "2" schemeName = "CUFE-SHA384" > ${cufe.raw} </cbc:UUID>
                                                                                                                    < cbc: IssueDate > ${issueDate} </cbc:IssueDate>
                                                                                                                        < cbc: IssueTime > ${issueTime} </cbc:IssueTime>
                                                                                                                            < cbc: InvoiceTypeCode >01 </cbc:InvoiceTypeCode>
                                                                                                                                < cbc: Note > ${invoice.notes || ''} </cbc:Note>
                                                                                                                                    < cbc: DocumentCurrencyCode > COP </cbc:DocumentCurrencyCode>
                                                                                                                                        < !--EMISOR Y RECEPTOR-- >
                                                                                                                                            <!--DATOS DE IMPUESTOS Y TOTALES-- >
                                                                                                                                                <cac: LegalMonetaryTotal >
                                                                                                                                                    <cbc:LineExtensionAmount currencyID = "COP" > ${(invoice.subtotal.value).toFixed(2)} </cbc:LineExtensionAmount>
                                                                                                                                                        < cbc:TaxExclusiveAmount currencyID = "COP" > ${(invoice.subtotal.value).toFixed(2)} </cbc:TaxExclusiveAmount>
                                                                                                                                                            < cbc:TaxInclusiveAmount currencyID = "COP" > ${(invoice.total.value).toFixed(2)} </cbc:TaxInclusiveAmount>
                                                                                                                                                                < cbc:PayableAmount currencyID = "COP" > ${(invoice.total.value).toFixed(2)} </cbc:PayableAmount>
                                                                                                                                                                    </cac:LegalMonetaryTotal>
                                                                                                                                                                    </Invoice>`;

        return xml;
    }
}
