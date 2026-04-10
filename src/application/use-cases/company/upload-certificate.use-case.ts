import { Injectable, Inject } from '@nestjs/common';
import * as crypto from 'crypto';
import { CertificateRepository } from '@domain/repositories/certificate.repository';
import { Certificate } from '@domain/entities/certificate.entity';
import { TOKENS } from '@shared/constants/tokens';
import { ICertificateEncryptor } from '@application/interfaces/certificate-encryptor.interface';
import { v4 as uuidv4 } from 'uuid';

export interface UploadCertificateInput {
    companyId: string;
    p12Buffer: Buffer;
    password: string;
}

@Injectable()
export class UploadCertificateUseCase {
    constructor(
        @Inject(TOKENS.CERTIFICATE_REPOSITORY) private readonly certRepo: CertificateRepository,
        @Inject(TOKENS.CERTIFICATE_ENCRYPTOR) private readonly encryptor: ICertificateEncryptor,
    ) { }

    async execute(input: UploadCertificateInput): Promise<Certificate> {
        // Encriptar el certificado P12
        const { encrypted, iv } = this.encryptor.encrypt(input.p12Buffer);

        // Extraer validTo y issuedBy del certificado P12
        let validFrom = new Date();
        let validTo = new Date();
        validTo.setFullYear(validTo.getFullYear() + 2); // Default fallback
        let issuedBy = 'DIAN/Auto-Mock';

        try {
            // Se usa eval('require') para evitar problemas con TS y node-forge si no está tipado completamente, 
            // aunque podemos usar import * as forge from 'node-forge' si estuviera arriba. Lo importaré localmente:
            const forge = require('node-forge');
            const p12Asn1 = forge.asn1.fromDer(input.p12Buffer.toString('binary'));
            const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, input.password);
            
            // Buscar en las bolsas (safe bags) para encontrar el certificado
            for (const safeBags of p12.safeContents) {
                for (const safeBag of safeBags.safeBags) {
                    if (safeBag.cert) {
                        validFrom = safeBag.cert.validity.notBefore;
                        validTo = safeBag.cert.validity.notAfter;
                        
                        const issuerItem = safeBag.cert.issuer.attributes.find((a: any) => a.shortName === 'CN');
                        if (issuerItem) {
                            issuedBy = issuerItem.value;
                        }
                        break;
                    }
                }
            }
        } catch (error) {
            throw new Error(`Contraseña incorrecta o certificado P12 inválido: ${error.message}`);
        }

        if (validTo < new Date()) {
            throw new Error('El certificado digital se encuentra vencido.');
        }

        const passwordHash = crypto.createHash('sha256').update(input.password).digest('hex');

        // Desactivar todos los demás activos de esta empresa
        await this.certRepo.deactivateAll(input.companyId);

        const cert = Certificate.create({
            id: uuidv4(),
            companyId: input.companyId,
            encryptedP12: encrypted,
            encryptionIV: iv,
            certPassword: passwordHash, // Se guarda el hash en la DB, no el texto plano
            validFrom,
            validTo,
            issuedBy,
        });

        return this.certRepo.create(cert);
    }
}
