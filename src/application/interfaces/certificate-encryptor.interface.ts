/** Puerto de salida: encriptación de certificados */
export interface ICertificateEncryptor {
    encrypt(p12Buffer: Buffer): { encrypted: string; iv: string };
    decrypt(encrypted: string, iv: string): Buffer;
}
