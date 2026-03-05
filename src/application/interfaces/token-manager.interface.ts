/** Puerto de salida: gestor de tokens JWT */
export interface ITokenManager {
    generateAccessToken(payload: Record<string, unknown>): string;
    generateRefreshToken(payload: Record<string, unknown>): string;
    verifyAccessToken(token: string): Record<string, unknown>;
    verifyRefreshToken(token: string): Record<string, unknown>;
    hashToken(token: string): Promise<string>;
    compareToken(token: string, hash: string): Promise<boolean>;
}
