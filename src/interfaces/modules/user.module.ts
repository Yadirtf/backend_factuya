import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserController } from '../controllers/user.controller';
import { UserDocument, UserSchema } from '@infrastructure/database/schemas/user.schema';
import { UserRepositoryImpl } from '@infrastructure/repositories/user.repository.impl';
import { TOKENS } from '@shared/constants/tokens';
import { CreateUserUseCase, GetUsersUseCase, UpdateUserRoleUseCase } from '@application/use-cases/user/user.use-case';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: UserDocument.name, schema: UserSchema }]),
    ],
    controllers: [UserController],
    providers: [
        { provide: TOKENS.USER_REPOSITORY, useClass: UserRepositoryImpl },
        CreateUserUseCase,
        GetUsersUseCase,
        UpdateUserRoleUseCase,
    ],
    exports: [TOKENS.USER_REPOSITORY],
})
export class UserModule { }
