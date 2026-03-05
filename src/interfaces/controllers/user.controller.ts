import { Controller, Post, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../http/guards/jwt-auth.guard';
import { RolesGuard } from '../http/guards/roles.guard';
import { Roles } from '../http/decorators/roles.decorator';
import { CurrentUser } from '../http/decorators/current-user.decorator';
import { JwtPayload } from '@application/use-cases/auth/auth.use-case';
import { UserRole } from '@domain/enums/user-role.enum';
import { CreateUserUseCase, GetUsersUseCase, UpdateUserRoleUseCase } from '@application/use-cases/user/user.use-case';
import { CreateUserDto, UpdateUserRoleDto } from '@application/dtos/user/user.dto';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UserController {
    constructor(
        private readonly createUser: CreateUserUseCase,
        private readonly getUsers: GetUsersUseCase,
        private readonly updateUserRole: UpdateUserRoleUseCase,
    ) { }

    @Post()
    @Roles(UserRole.ADMIN) // Solo un ADMIN puede crear nuevos usuarios
    create(@Body() dto: CreateUserDto, @CurrentUser() user: JwtPayload) {
        return this.createUser.execute(dto, user.companyId);
    }

    @Get()
    @Roles(UserRole.ADMIN)
    findAll(@CurrentUser() user: JwtPayload) {
        return this.getUsers.execute(user.companyId);
    }

    @Patch(':id/role')
    @Roles(UserRole.ADMIN)
    updateRole(
        @Param('id') id: string,
        @Body() dto: UpdateUserRoleDto,
        @CurrentUser() user: JwtPayload
    ) {
        return this.updateUserRole.execute(id, user.companyId, dto);
    }
}
