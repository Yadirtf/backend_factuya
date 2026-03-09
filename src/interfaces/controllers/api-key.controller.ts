import { Controller, Get, Post, Body, Param, Delete, UseGuards, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CreateApiKeyUseCase, GetApiKeysUseCase, RevokeApiKeyUseCase, CreateApiKeyDto } from '@application/use-cases/api-key/api-key.use-case';
import { JwtAuthGuard } from '../http/guards/jwt-auth.guard';
import { RolesGuard } from '../http/guards/roles.guard';
import { Roles } from '../http/decorators/roles.decorator';
import { CurrentUser } from '../http/decorators/current-user.decorator';
import { JwtPayload } from '@application/use-cases/auth/auth.use-case';
import { UserRole } from '@domain/enums/user-role.enum';

@ApiTags('API Keys')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api-keys')
export class ApiKeyController {
    constructor(
        private readonly createApiKey: CreateApiKeyUseCase,
        private readonly getApiKeys: GetApiKeysUseCase,
        private readonly revokeApiKey: RevokeApiKeyUseCase,
    ) { }

    @Post()
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Create a new API Key for external systems' })
    create(@Body() dto: CreateApiKeyDto & { companyId?: string }, @CurrentUser() user: JwtPayload) {
        const targetCompanyId = (user.role === UserRole.SUPER_ADMIN && dto.companyId) ? dto.companyId : user.companyId;
        return this.createApiKey.execute(targetCompanyId, dto);
    }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'List all API Keys for the company' })
    findAll(@Query('companyId') targetCompanyId: string, @CurrentUser() user: JwtPayload) {
        const resolvedCompanyId = (user.role === UserRole.SUPER_ADMIN && targetCompanyId) ? targetCompanyId : user.companyId;
        return this.getApiKeys.execute(resolvedCompanyId);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Revoke (deactivate) an API Key' })
    revoke(@Param('id') id: string, @Query('companyId') targetCompanyId: string, @CurrentUser() user: JwtPayload) {
        const resolvedCompanyId = (user.role === UserRole.SUPER_ADMIN && targetCompanyId) ? targetCompanyId : user.companyId;
        return this.revokeApiKey.execute(id, resolvedCompanyId);
    }
}
