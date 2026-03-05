import { Injectable } from '@nestjs/common';
import { IDianClient, DianResponse } from '@application/interfaces/dian-client.interface';

/**
 * Cliente DIAN de simulación para ambiente de desarrollo y pruebas locales.
 * Reemplazar por DianSoapClient en producción o cuando se integre con la DIAN real.
 *
 * Simula la respuesta de la DIAN para el ambiente de habilitación.
 */
@Injectable()
export class DianMockClient implements IDianClient {
    async sendInvoice(input: {
        signedXml: string;
        companyNit: string;
        softwareId: string;
    }): Promise<DianResponse> {
        // Simula un delay de red
        await new Promise(resolve => setTimeout(resolve, 300));

        // Simula respuesta exitosa para pruebas — 90% de aceptación
        const isAccepted = Math.random() > 0.1;

        if (isAccepted) {
            return {
                isAccepted: true,
                statusCode: '00',
                statusMessage: 'La factura electrónica fue aceptada',
                qrCode: `https://catalogo-vpfe-hab.dian.gov.co/document/searchqr?documentkey=MOCK_${Date.now()}`,
                rawResponse: JSON.stringify({ mockResponse: true, accepted: true, timestamp: new Date() }),
            };
        } else {
            return {
                isAccepted: false,
                statusCode: '99',
                statusMessage: 'Error de prueba simulado: datos incorrectos en mock',
                rawResponse: JSON.stringify({ mockResponse: true, accepted: false, timestamp: new Date() }),
            };
        }
    }

    async getInvoiceStatus(cufe: string, companyNit: string): Promise<DianResponse> {
        await new Promise(resolve => setTimeout(resolve, 200));
        return {
            isAccepted: true,
            statusCode: '00',
            statusMessage: 'Factura aceptada (mock)',
            cufe,
            rawResponse: JSON.stringify({ cufe, status: 'ACCEPTED', mock: true }),
        };
    }
}
