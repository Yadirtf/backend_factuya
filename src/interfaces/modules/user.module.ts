import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserController } from '../controllers/user.controller';
import { UserDocument, UserSchema } from '@infrastructure/database/schemas/user.schema';
import { RoleDocument, RoleSchema, PersonDocument, PersonSchema } from '@infrastructure/database/schemas/person_role.schema';
import { UserRepositoryImpl } from '@infrastructure/repositories/user.repository.impl';
import { RoleRepositoryImpl, PersonRepositoryImpl } from '@infrastructure/repositories/person-role.repository.impl';
import { TOKENS } from '@shared/constants/tokens';
import { CreateUserUseCase, GetUsersUseCase, UpdateUserRoleUseCase } from '@application/use-cases/user/user.use-case';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: UserDocument.name, schema: UserSchema },
            { name: RoleDocument.name, schema: RoleSchema },
            { name: PersonDocument.name, schema: PersonSchema },
        ]),
    ],
    controllers: [UserController],
    providers: [
        { provide: TOKENS.USER_REPOSITORY, useClass: UserRepositoryImpl },
        { provide: TOKENS.ROLE_REPOSITORY, useClass: RoleRepositoryImpl },
        { provide: TOKENS.PERSON_REPOSITORY, useClass: PersonRepositoryImpl },
        CreateUserUseCase,
        GetUsersUseCase,
        UpdateUserRoleUseCase,
    ],
    exports: [
        TOKENS.USER_REPOSITORY,
        TOKENS.ROLE_REPOSITORY,
        TOKENS.PERSON_REPOSITORY,
    ],
})
export class UserModule { }
