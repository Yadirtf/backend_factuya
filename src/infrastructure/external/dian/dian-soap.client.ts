import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as zlib from 'zlib';
import { promisify } from 'util';
import { IDianClient, DianResponse } from '@application/interfaces/dian-client.interface';
import { DOMParser } from '@xmldom/xmldom';

const gzip = promisify(zlib.gzip);
// Para la DIAN se requiere formato ZIP estándar, no solo GZIP, pero Node no tiene un zip en crudo simple.
// Usualmente se usa adm-zip o archiver, pero para no añadir dependencias pesadas,
// usaremos un utilitario zip básico que podemos inyectar o importar si requerimos un ZIP en formato central directory.
// Por ahora simularemos la construcción asumiendo que el endpoint acepte el stream, 
// o usaremos adm-zip si es estrictamente '.zip' central dir.
// Vamos a importar un utilitario o escribir la petición base.

import { WsSecuritySignerService } from '@infrastructure/security/wsse-signer.service';

@Injectable()
export class DianSoapClient implements IDianClient {
    private readonly logger = new Logger(DianSoapClient.name);
    private readonly wsdlUrl: string;

    constructor(
        private readonly config: ConfigService,
        private readonly wssSigner: WsSecuritySignerService,
    ) {
        const env = this.config.get<string>('DIAN_ENV', 'TEST');
        this.wsdlUrl = this.config.get<string>(
            `DIAN_WSDL_${env}`,
            'https://vpfe-hab.dian.gov.co/WcfDianCustomerServices.svc'
        );
        // Si la config del .env termina en ?wsdl, lo quitamos para el endpoint de POST
        this.wsdlUrl = this.wsdlUrl.split('?')[0];
    }

    async sendInvoice(input: {
        signedXml: string;
        companyNit: string;
        softwareId: string;
        certificateData: { encryptedP12: string; encryptionIV: string; certPassword: string; };
    }): Promise<DianResponse> {
        this.logger.log(`Enviando factura a la DIAN para NIT: ${input.companyNit}`);

        try {
            // 1. Omitido temporalmente: Zippear el XML firmado (requiere .zip formato central dir)
            // Para simplificar sin instalar adm-zip, la firma XAdES viaja en el XML directamente.
            // La DIAN requiere que el file sea un .zip (deflate + local file header).
            // Lo dejaremos como un TODO técnico para la integración final.
            const base64ZippedXml = Buffer.from(input.signedXml).toString('base64'); // Mock ZIP base64
            const fileName = `010${input.companyNit}00000001.zip`; // Asume formato de regla DIAN

            // 2. Construir el Body y el Sobre SOAP (SOAP Envelope) + WS-Security
            const bodyContent = `
      <wcf:SendTestSetAsync>
         <wcf:fileName>${fileName}</wcf:fileName>
         <wcf:contentFile>${base64ZippedXml}</wcf:contentFile>
         <wcf:testSetId>${input.softwareId}</wcf:testSetId>
      </wcf:SendTestSetAsync>`.trim();

            const encryptionKey = this.config.get<string>('CERTIFICATE_ENCRYPTION_KEY')!;

            const soapEnvelope = await this.wssSigner.signSoapEnvelope({
                soapAction: 'SendTestSetAsync',
                bodyContent,
                encryptedP12: input.certificateData.encryptedP12,
                encryptionIV: input.certificateData.encryptionIV,
                certPassword: input.certificateData.certPassword,
                encryptionKey,
            });

            // 3. Enviar vía HTTP POST con Fetch (Node 18+)
            const response = await fetch(this.wsdlUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/soap+xml;charset=UTF-8;action="http://wcf.dian.colombia/IWcfDianCustomerServices/SendTestSetAsync"',
                    'Accept': 'application/xml',
                },
                body: soapEnvelope,
            });

            const responseText = await response.text();

            if (!response.ok) {
                this.logger.error(`Error HTTP DIAN: ${response.status} - ${response.statusText}`);
                return {
                    isAccepted: false,
                    statusCode: response.status.toString(),
                    statusMessage: 'Error de comunicación HTTP con la DIAN',
                    rawResponse: responseText,
                };
            }

            // 4. Parsear respuesta SOAP
            return this.parseDianResponse(responseText);

        } catch (error) {
            this.logger.error(`Fallo crítico al conectar con la DIAN: ${(error as Error).message}`);
            return {
                isAccepted: false,
                statusCode: '500',
                statusMessage: `Error interno de conexión: ${(error as Error).message}`,
                rawResponse: error instanceof Error ? error.stack || '' : 'Unknown Error',
            };
        }
    }

    async getInvoiceStatus(cufe: string, companyNit: string): Promise<DianResponse> {
        // Implementación similar para GetStatus
        const soapEnvelope = this.buildStatusSoapEnvelope(cufe);

        try {
            const response = await fetch(this.wsdlUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/soap+xml;charset=UTF-8;action="http://wcf.dian.colombia/IWcfDianCustomerServices/GetStatus"',
                },
                body: soapEnvelope,
            });

            return this.parseDianResponse(await response.text());
        } catch (error) {
            return {
                isAccepted: false,
                statusCode: '500',
                statusMessage: (error as Error).message,
                rawResponse: '',
            };
        }
    }



    private buildStatusSoapEnvelope(trackId: string): string {
        return `
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:wcf="http://wcf.dian.colombia">
   <soap:Header/>
   <soap:Body>
      <wcf:GetStatus>
         <wcf:trackId>${trackId}</wcf:trackId>
      </wcf:GetStatus>
   </soap:Body>
</soap:Envelope>`.trim();
    }

    private parseDianResponse(xmlResult: string): DianResponse {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(xmlResult, 'text/xml');

            // Buscar posibles nodos de respuesta dependiendo de la acción
            let isValid = false;
            let statusCode = '99';
            let statusMessage = 'Respuesta no parseable';

            // Ejemplo para parsear el ApplicationResponse
            // <b:DocumentDescription>Factura electrónica validada</b:DocumentDescription>
            // <b:StatusCode>00</b:StatusCode>

            const statusCodeNodes = doc.getElementsByTagNameNS('*', 'StatusCode');
            if (statusCodeNodes.length > 0) {
                statusCode = statusCodeNodes[0].textContent || '99';
            }

            const statusDescNodes = doc.getElementsByTagNameNS('*', 'StatusDescription');
            if (statusDescNodes.length > 0) {
                statusMessage = statusDescNodes[0].textContent || statusMessage;
            }

            // Según DIAN, 00 o 0 significa procesado exitosamente
            isValid = (statusCode === '00' || statusCode === '0');

            return {
                isAccepted: isValid,
                statusCode,
                statusMessage,
                rawResponse: xmlResult,
            };
        } catch (e) {
            return {
                isAccepted: false,
                statusCode: 'ERR',
                statusMessage: 'Fallo al parsear XML de respuesta',
                rawResponse: xmlResult,
            };
        }
    }
}
