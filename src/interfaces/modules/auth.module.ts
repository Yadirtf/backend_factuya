import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Schemas
import { UserDocument, UserSchema } from '@infrastructure/database/schemas/user.schema';
import { CompanyDocument, CompanySchema } from '@infrastructure/database/schemas/company.schema';

// Repositorios
import { UserRepositoryImpl } from '@infrastructure/repositories/user.repository.impl';
import { CompanyRepositoryImpl } from '@infrastructure/repositories/company.repository.impl';

// Use Cases
import { LoginUseCase, LogoutUseCase, RegisterCompanyUseCase, CheckSetupUseCase } from '@application/use-cases/auth/auth.use-case';

// Infrastructure
import { JwtStrategy } from '@infrastructure/security/jwt.strategy';

// Controller
import { AuthController } from '../controllers/auth.controller';

// Tokens
import { TOKENS } from '@shared/constants/tokens';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: UserDocument.name, schema: UserSchema },
            { name: CompanyDocument.name, schema: CompanySchema },
        ]),
        PassportModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.get('JWT_SECRET'),
                signOptions: { expiresIn: config.get('JWT_EXPIRATION', '15m') },
            }),
        }),
    ],
    controllers: [AuthController],
    providers: [
        { provide: TOKENS.USER_REPOSITORY, useClass: UserRepositoryImpl },
        { provide: TOKENS.COMPANY_REPOSITORY, useClass: CompanyRepositoryImpl },
        LoginUseCase,
        LogoutUseCase,
        RegisterCompanyUseCase,
        CheckSetupUseCase,
        JwtStrategy,
    ],
    exports: [TOKENS.USER_REPOSITORY, TOKENS.COMPANY_REPOSITORY, JwtModule],
})
export class AuthModule { }
