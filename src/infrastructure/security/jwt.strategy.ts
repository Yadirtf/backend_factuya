import { Injectable, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '@application/use-cases/auth/auth.use-case';
import { UserRepository } from '@domain/repositories/user.repository';
import { TOKENS } from '@shared/constants/tokens';
import { UnauthorizedException } from '@shared/exceptions/unauthorized.exception';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(
        config: ConfigService,
        @Inject(TOKENS.USER_REPOSITORY) private readonly userRepo: UserRepository,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: config.get<string>('JWT_SECRET') ?? 'fallback-secret-must-set-env',
        });
    }

    async validate(payload: JwtPayload): Promise<JwtPayload> {
        const user = await this.userRepo.findById(payload.sub, payload.companyId);

        if (!user || !user.isActive) {
            throw new UnauthorizedException('User no longer exists or is inactive');
        }

        return payload;
    }
}
