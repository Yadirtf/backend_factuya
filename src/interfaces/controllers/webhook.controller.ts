import { Controller, Get, Post, Body, Param, Delete, UseGuards, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { WebhookRepository } from '@domain/repositories/webhook.repository';
import { Webhook, WebhookEvent } from '@domain/entities/webhook.entity';
import { JwtAuthGuard } from '../http/guards/jwt-auth.guard';
import { RolesGuard } from '../http/guards/roles.guard';
import { Roles } from '../http/decorators/roles.decorator';
import { CurrentUser } from '../http/decorators/current-user.decorator';
import { JwtPayload } from '@application/use-cases/auth/auth.use-case';
import { UserRole } from '@domain/enums/user-role.enum';
import { TOKENS } from '@shared/constants/tokens';
import { Inject } from '@nestjs/common';
import { NotFoundException } from '@shared/exceptions/not-found.exception';

export interface CreateWebhookDto {
    url: string;
    events?: WebhookEvent[];
    companyId?: string;
}

@ApiTags('Webhooks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('webhooks')
export class WebhookController {
    constructor(
        @Inject(TOKENS.WEBHOOK_REPOSITORY) private readonly repo: WebhookRepository,
    ) { }

    @Post()
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Register a new webhook for notifications' })
    async create(@Body() dto: CreateWebhookDto, @CurrentUser() user: JwtPayload) {
        const targetCompanyId = (user.role === UserRole.SUPER_ADMIN && dto.companyId) ? dto.companyId : user.companyId;
        const webhook = Webhook.create({
            companyId: targetCompanyId,
            url: dto.url,
            events: dto.events,
        });
        await this.repo.create(webhook);
        return webhook;
    }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'List all registered webhooks' })
    findAll(@Query('companyId') targetCompanyId: string, @CurrentUser() user: JwtPayload) {
        const resolvedCompanyId = (user.role === UserRole.SUPER_ADMIN && targetCompanyId) ? targetCompanyId : user.companyId;
        return this.repo.findAll(resolvedCompanyId);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a webhook' })
    async delete(@Param('id') id: string, @Query('companyId') targetCompanyId: string, @CurrentUser() user: JwtPayload) {
        const resolvedCompanyId = (user.role === UserRole.SUPER_ADMIN && targetCompanyId) ? targetCompanyId : user.companyId;
        const webhook = await this.repo.findById(id, resolvedCompanyId);
        if (!webhook) throw new NotFoundException('Webhook');
        await this.repo.delete(id, resolvedCompanyId);
    }
}
