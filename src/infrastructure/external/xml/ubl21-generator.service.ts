import { Injectable } from '@nestjs/common';
import { IXmlGenerator, GenerateXmlInput } from '@application/interfaces/xml-generator.interface';

/**
 * Generador de XML UBL 2.1 conforme a DIAN Colombia.
 * Resolución 165/2023 — Anexo Técnico Factura Electrónica v1.9
 *
 * TODO Fase 3: Implementar con template engine (Handlebars) para generación XML completa.
 * Este stub genera un XML básico para permitir las pruebas del flujo hasta la firma.
 */
@Injectable()
export class Ubl21GeneratorService implements IXmlGenerator {
    async generate(input: GenerateXmlInput): Promise<string> {
        const { invoice, cufe, companyData, customerData, environment } = input;

        return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
  xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
  <ext:UBLExtensions>
    <ext:UBLExtension>
      <ext:ExtensionContent/>
      <!-- Firma XAdES-BES se inserta aquí -->
    </ext:UBLExtension>
  </ext:UBLExtensions>
  <cbc:UBLVersionID>UBL 2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>${environment === '1' ? '10' : '09'}</cbc:CustomizationID>
  <cbc:ProfileID>DIAN 2.1</cbc:ProfileID>
  <cbc:ProfileExecutionID>${environment}</cbc:ProfileExecutionID>
  <cbc:ID>${invoice.fullNumber}</cbc:ID>
  <cbc:UUID schemeID="${environment}" schemeName="CUFE-SHA384">${cufe.raw}</cbc:UUID>
  <cbc:IssueDate>${invoice.issueDate.toISOString().split('T')[0]}</cbc:IssueDate>
  <cbc:IssueTime>${invoice.issueDate.toISOString().split('T')[1].slice(0, 8)}-05:00</cbc:IssueTime>
  <cbc:DueDate>${invoice.dueDate?.toISOString().split('T')[0] ?? invoice.issueDate.toISOString().split('T')[0]}</cbc:DueDate>
  <cbc:InvoiceTypeCode listID="${invoice.type}">01</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>COP</cbc:DocumentCurrencyCode>
  <cbc:LineCountNumeric>${invoice.items.length}</cbc:LineCountNumeric>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="31" schemeAgencyID="47">${companyData.nit}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name><![CDATA[${companyData.businessName}]]></cbc:Name>
      </cac:PartyName>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="${customerData.documentType}" schemeAgencyID="47">${customerData.documentNumber}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name><![CDATA[${customerData.businessName ?? `${customerData.firstName} ${customerData.lastName}`}]]></cbc:Name>
      </cac:PartyName>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="COP">${invoice.subtotal.value.toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="COP">${invoice.subtotal.value.toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="COP">${invoice.total.value.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="COP">${invoice.total.value.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  ${invoice.items.map((item, idx) => `
  <cac:InvoiceLine>
    <cbc:ID>${idx + 1}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="EA">${item.quantity}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="COP">${item.subtotal.value.toFixed(2)}</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Description><![CDATA[${item.description}]]></cbc:Description>
      <cac:SellersItemIdentification>
        <cbc:ID>${item.productCode}</cbc:ID>
      </cac:SellersItemIdentification>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="COP">${item.unitPrice.value.toFixed(2)}</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>`).join('')}
</Invoice>`;
    }
}
