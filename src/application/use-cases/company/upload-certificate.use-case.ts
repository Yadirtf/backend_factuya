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

        // TODO: extraer validFrom, validTo, issuedBy del certificado P12 usando node-forge o crypto
        // Por simplificación en este nivel, definiremos un mock de validez
        const validFrom = new Date();
        const validTo = new Date();
        validTo.setFullYear(validTo.getFullYear() + 2);

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
            issuedBy: 'DIAN/Auto-Mock',
        });

        return this.certRepo.create(cert);
    }
}
