export enum UserRole {
    SUPER_ADMIN = 'SUPER_ADMIN',   // Administrador del SaaS
    ADMIN = 'ADMIN',               // Administrador de empresa
    OPERATOR = 'OPERATOR',         // Operador (crea facturas)
    ACCOUNTANT = 'ACCOUNTANT',     // Contador (aprueba y envía a DIAN)
    VIEWER = 'VIEWER',             // Solo lectura
}
