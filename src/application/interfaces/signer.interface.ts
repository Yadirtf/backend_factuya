/** Puerto de salida: firma digital XAdES-BES */
export interface ISignerService {
    sign(input: { xml: string; encryptedP12: string; encryptionIV: string; certPassword: string }): Promise<string>;
}
