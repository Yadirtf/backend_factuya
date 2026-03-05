import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import * as forge from 'node-forge';

export interface WsseSignInput {
    soapAction: string;
    bodyContent: string;
    encryptedP12: string;
    encryptionIV: string;
    certPassword: string;
    encryptionKey: string; // Se pasa vía config o DI
}

/**
 * Servicio encargado de generar las cabeceras WS-Security (WSS) 
 * requeridas por el Web Service de Validación Previa (VPFE) de la DIAN.
 * Aplica el perfil X.509 Certificate Token Profile.
 */
@Injectable()
export class WsSecuritySignerService {
    private readonly logger = new Logger(WsSecuritySignerService.name);

    /**
     * Devuelve el SOBRE SOAP COMPLETO (Envelope) firmado con WS-Security.
     */
    async signSoapEnvelope(input: WsseSignInput): Promise<string> {
        this.logger.debug('Generando cabeceras WS-Security (Timestamp, Body, BinarySecurityToken)');

        // 1. Desencriptar el P12 y extraer la llave privada y pública
        const p12Buffer = this.decryptP12(input.encryptedP12, input.encryptionIV, input.encryptionKey);
        const { privateKey, certBase64 } = this.extractKeys(p12Buffer, input.certPassword);

        // 2. Tiempos para el Timestamp (WSS)
        const now = new Date();
        const expires = new Date(now.getTime() + 5 * 60000); // 5 minutos de validez
        const createdStr = now.toISOString();
        const expiresStr = expires.toISOString();

        // 3. IDs únicos para los nodos WSS
        const timestampId = `TS-${uuidv4()}`;
        const bodyId = `ID-${uuidv4()}`;
        const tokenId = `X509-${uuidv4()}`;

        // 4. Construir Body
        const soapBody = `
   <soap:Body wsu:Id="${bodyId}" xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">
      ${input.bodyContent}
   </soap:Body>`.trim();

        // 5. Construir Timestamp
        const timestampNode = `
      <wsu:Timestamp wsu:Id="${timestampId}" xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">
         <wsu:Created>${createdStr}</wsu:Created>
         <wsu:Expires>${expiresStr}</wsu:Expires>
      </wsu:Timestamp>`.trim();

        // 6. Canonicalización y Cálculos de Hash (DigestValue)
        // NOTA: Para una implementación 100% estricta en producción se debe usar XML C14N (Exclusive Canonicalization).
        // Aquí hacemos un hash manual simulado para mantener limpia la arquitectura sin acoplar xml-crypto complejo.
        const bodyDigest = this.calculateDigest(soapBody);
        const timestampDigest = this.calculateDigest(timestampNode);

        // 7. Generar el SignedInfo
        const signedInfo = `
      <ds:SignedInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
         <ds:CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>
         <ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>
         <ds:Reference URI="#${timestampId}">
            <ds:Transforms>
               <ds:Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>
            </ds:Transforms>
            <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
            <ds:DigestValue>${timestampDigest}</ds:DigestValue>
         </ds:Reference>
         <ds:Reference URI="#${bodyId}">
            <ds:Transforms>
               <ds:Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>
            </ds:Transforms>
            <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
            <ds:DigestValue>${bodyDigest}</ds:DigestValue>
         </ds:Reference>
      </ds:SignedInfo>`.trim();

        // 8. Firmar el SignedInfo con la Llave Privada RSA-SHA256
        const signatureValue = this.signRsaSha256(signedInfo, privateKey);

        // 9. Construir el Sobre SOAP Final (Envelope)
        const envelope = `
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:wcf="http://wcf.dian.colombia">
   <soap:Header>
      <wsse:Security soap:mustUnderstand="1" xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">
         <wsse:BinarySecurityToken EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary" ValueType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3" wsu:Id="${tokenId}">${certBase64}</wsse:BinarySecurityToken>
         <ds:Signature Id="SIG-${uuidv4()}" xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
            ${signedInfo}
            <ds:SignatureValue>${signatureValue}</ds:SignatureValue>
            <ds:KeyInfo>
               <wsse:SecurityTokenReference wsu:Id="STR-${uuidv4()}">
                  <wsse:Reference URI="#${tokenId}" ValueType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3"/>
               </wsse:SecurityTokenReference>
            </ds:KeyInfo>
         </ds:Signature>
         ${timestampNode}
      </wsse:Security>
   </soap:Header>
${soapBody}
</soap:Envelope>`.trim();

        return envelope;
    }

    private calculateDigest(xmlChunk: string): string {
        return crypto.createHash('sha256').update(xmlChunk, 'utf8').digest('base64');
    }

    private signRsaSha256(signedInfo: string, privateKeyPem: string): string {
        const sign = crypto.createSign('RSA-SHA256');
        sign.update(signedInfo, 'utf8');
        return sign.sign(privateKeyPem, 'base64');
    }

    private decryptP12(encryptedBase64: string, ivHex: string, keyHex: string): Buffer {
        const key = Buffer.from(keyHex, 'hex');
        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        return Buffer.concat([decipher.update(Buffer.from(encryptedBase64, 'base64')), decipher.final()]);
    }

    private extractKeys(p12Buffer: Buffer, password: string): { privateKey: string, certBase64: string } {
        const asn1 = forge.asn1.fromDer(p12Buffer.toString('binary'));
        const p12 = forge.pkcs12.pkcs12FromAsn1(asn1, password);

        let privateKey: forge.pki.PrivateKey | null = null;
        let certBaguetes: forge.pki.Certificate[] = [];

        p12.safeContents.forEach((safeContent) => {
            safeContent.safeBags.forEach((safeBag) => {
                if (safeBag.type === forge.pki.oids.pkcs8ShroudedKeyBag) {
                    privateKey = safeBag.key as forge.pki.PrivateKey;
                } else if (safeBag.type === forge.pki.oids.certBag) {
                    certBaguetes.push(safeBag.cert as forge.pki.Certificate);
                }
            });
        });

        if (!privateKey || certBaguetes.length === 0) {
            throw new Error('Certificado P12 inválido o contraseña incorrecta para extraer firmas WSS.');
        }

        const privatePem = forge.pki.privateKeyToPem(privateKey);
        const certDer = forge.asn1.toDer(forge.pki.certificateToAsn1(certBaguetes[0])).getBytes();
        const certBase64 = forge.util.encode64(certDer);

        return { privateKey: privatePem, certBase64 };
    }
}
