import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '@application/use-cases/auth/auth.use-case';

export const CurrentUser = createParamDecorator(
    (_: unknown, ctx: ExecutionContext): JwtPayload => {
        const request = ctx.switchToHttp().getRequest<{ user: JwtPayload }>();
        return request.user;
    },
);
