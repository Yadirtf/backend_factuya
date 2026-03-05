import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { ICertificateEncryptor } from '@application/interfaces/certificate-encryptor.interface';
import { ConfigService } from '@nestjs/config';

/**
 * Implementación de encriptación de certificados .p12 usando AES-256-CBC.
 * La clave se lee de la variable de entorno CERTIFICATE_ENCRYPTION_KEY (32 bytes hex).
 */
@Injectable()
export class AesEncryptorService implements ICertificateEncryptor {
    private readonly algorithm = 'aes-256-cbc';
    private readonly key: Buffer;

    constructor(private readonly config: ConfigService) {
        const keyHex = this.config.get<string>('CERTIFICATE_ENCRYPTION_KEY');
        if (!keyHex || keyHex.length < 64) {
            throw new Error('CERTIFICATE_ENCRYPTION_KEY must be at least 32 bytes (64 hex chars)');
        }
        this.key = Buffer.from(keyHex.slice(0, 64), 'hex');
    }

    encrypt(p12Buffer: Buffer): { encrypted: string; iv: string } {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
        const encrypted = Buffer.concat([cipher.update(p12Buffer), cipher.final()]);
        return {
            encrypted: encrypted.toString('base64'),
            iv: iv.toString('hex'),
        };
    }

    decrypt(encrypted: string, iv: string): Buffer {
        const decipher = crypto.createDecipheriv(
            this.algorithm,
            this.key,
            Buffer.from(iv, 'hex'),
        );
        return Buffer.concat([
            decipher.update(Buffer.from(encrypted, 'base64')),
            decipher.final(),
        ]);
    }
}
