import { Injectable, Inject } from '@nestjs/common';
import { ISignerService } from '@application/interfaces/signer.interface';
import { ICertificateEncryptor } from '@application/interfaces/certificate-encryptor.interface';
import { TOKENS } from '@shared/constants/tokens';
import * as forge from 'node-forge';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import { Crypto } from '@peculiar/webcrypto';
import * as xadesjs from 'xadesjs';

const webcrypto = new Crypto();
xadesjs.Application.setEngine('NodeJS', webcrypto);

@Injectable()
export class XadesSignerService implements ISignerService {
    constructor(
        @Inject(TOKENS.CERTIFICATE_ENCRYPTOR)
        private readonly encryptor: ICertificateEncryptor,
    ) { }

    async sign(input: {
        xml: string;
        encryptedP12: string;
        encryptionIV: string;
        certPassword: string;
    }): Promise<string> {
        // Desencriptar certificado
        const p12Buffer = this.encryptor.decrypt(input.encryptedP12, input.encryptionIV);
        const p12B64 = p12Buffer.toString('base64');
        const p12Der = forge.util.decode64(p12B64);
        const p12Asn1 = forge.asn1.fromDer(p12Der);

        const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, input.certPassword);

        // Extraer clave privada y certificado
        let privateKeyForge: forge.pki.PrivateKey | null = null;
        let certForge: forge.pki.Certificate | null = null;

        for (const safeContent of p12.safeContents) {
            for (const safeBag of safeContent.safeBags) {
                if (safeBag.type === forge.pki.oids.keyBag || safeBag.type === forge.pki.oids.pkcs8ShroudedKeyBag) {
                    privateKeyForge = safeBag.key as forge.pki.PrivateKey;
                }
                if (safeBag.type === forge.pki.oids.certBag) {
                    certForge = safeBag.cert as forge.pki.Certificate;
                }
            }
        }

        if (!privateKeyForge || !certForge) {
            throw new Error('Certificado P12 no contiene clave privada o certificado.');
        }

        // Convertir forge PK a PEM a ArrayBuffer para WebCrypto
        const privateKeyPem = forge.pki.privateKeyToPem(privateKeyForge);
        const certDer = forge.asn1.toDer(forge.pki.certificateToAsn1(certForge)).getBytes();
        const certPem = forge.pki.certificateToPem(certForge);

        // Importar clave a WebCrypto
        const pemHeader = "-----BEGIN PRIVATE KEY-----";
        const pemFooter = "-----END PRIVATE KEY-----";
        let pemContents = privateKeyPem.substring(privateKeyPem.indexOf(pemHeader) + pemHeader.length, privateKeyPem.indexOf(pemFooter));
        const binaryDerString = Buffer.from(pemContents.replace(/\s/g, ''), 'base64');

        const cryptoKey = await webcrypto.subtle.importKey(
            'pkcs8',
            binaryDerString,
            {
                name: 'RSASSA-PKCS1-v1_5',
                hash: { name: 'SHA-256' },
            },
            true,
            ['sign']
        );

        // Crear documento XML
        const xmlDoc = new DOMParser().parseFromString(input.xml, 'application/xml');

        // Configurar XAdES-BES
        const xadesXml = new xadesjs.SignedXml();

        // Extraer DER public cert format para xadesjs
        const x509PemHeader = "-----BEGIN CERTIFICATE-----";
        const x509PemFooter = "-----END CERTIFICATE-----";
        let certPemContents = certPem.substring(certPem.indexOf(x509PemHeader) + x509PemHeader.length, certPem.indexOf(x509PemFooter));
        const certArrayBuffer = Buffer.from(certPemContents.replace(/\s/g, ''), 'base64');

        // Firmar documento
        const alg = { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' } as any;
        await xadesXml.Sign(
            alg,
            cryptoKey,
            xmlDoc,
            {
                keyValue: cryptoKey,
                references: [
                    { uri: '', hash: 'SHA-256', transforms: ['enveloped'] }
                ],
                x509: [certArrayBuffer],
                signingCertificate: certArrayBuffer
            } as any
        );

        // Insertar firma en ext:ExtensionContent
        const signatureElement = xadesXml.GetXml();

        // Buscamos UBLExtension y ExtensionContent
        const extensionElements = xmlDoc.getElementsByTagName('ext:ExtensionContent');
        if (extensionElements.length > 0) {
            const firstExt = extensionElements.item(0);
            if (firstExt && signatureElement) firstExt.appendChild(signatureElement);
        } else {
            // Documento puro
            if (xmlDoc.documentElement && signatureElement) xmlDoc.documentElement.appendChild(signatureElement);
        }

        const serializer = new XMLSerializer();
        return serializer.serializeToString(xmlDoc);
    }
}
