import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@domain/enums/user-role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { JwtPayload } from '@application/use-cases/auth/auth.use-case';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles || requiredRoles.length === 0) return true;

        const { user } = context.switchToHttp().getRequest<{ user: JwtPayload }>();
        if (!user) throw new ForbiddenException('Access denied');

        // SUPER_ADMIN tiene acceso total
        if (user.role === UserRole.SUPER_ADMIN) return true;

        // Si es una máquina autenticada por API Key, se permite (los permisos de la API Key se validarían en otro lado si existieran)
        const isMachine = (user as any).isMachine;
        if (isMachine) return true;

        if (!requiredRoles.includes(user.role)) {
            throw new ForbiddenException(`Role ${user.role} is not allowed. Required: ${requiredRoles.join(', ')}`);
        }
        return true;
    }
}
