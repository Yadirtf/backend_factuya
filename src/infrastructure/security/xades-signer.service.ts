import { Injectable, Inject } from '@nestjs/common';
import { ISignerService } from '@application/interfaces/signer.interface';
import { ICertificateEncryptor } from '@application/interfaces/certificate-encryptor.interface';
import { TOKENS } from '@shared/constants/tokens';

/**
 * Servicio de firma digital XAdES-BES.
 *
 * TODO Fase 3: Implementación completa con xadesjs + @peculiar/webcrypto + pkijs.
 *
 * Stub actual: retorna el XML tal cual para permitir el flujo hasta DIAN Mock.
 * La firma real requiere:
 * 1. `npm install xadesjs @peculiar/webcrypto pkijs`
 * 2. Parsear el .p12 con pkijs
 * 3. Crear XAdES.SignedXml con perfil BES
 * 4. Insertar la firma en el nodo ext:ExtensionContent del XML UBL
 */
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
        // Desencriptar el .p12 para verificar que funciona
        const p12Buffer = this.encryptor.decrypt(input.encryptedP12, input.encryptionIV);

        // TODO Fase 3: Implementar firma XAdES-BES real
        // const { Crypto } = await import('@peculiar/webcrypto');
        // const { XAdES } = await import('xadesjs');
        // const webcrypto = new Crypto();
        // ... parsear p12Buffer con pkijs ...
        // ... firmar el xml con XAdES.SignedXml ...

        // Por ahora retornamos el XML sin firmar (válido para DIAN Mock)
        const dummySignature = `<!-- XAdES-BES Signature placeholder - P12 size: ${p12Buffer.length} bytes -->`;
        return input.xml.replace('<ext:ExtensionContent/>', `<ext:ExtensionContent>${dummySignature}</ext:ExtensionContent>`);
    }
}
