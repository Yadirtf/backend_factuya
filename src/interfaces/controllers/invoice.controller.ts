import {
    Controller, Get, Post, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import {
    CreateInvoiceUseCase, GetInvoicesUseCase, GetInvoiceByIdUseCase,
    SendToDianUseCase, CancelInvoiceUseCase,
} from '@application/use-cases/invoice/invoice.use-case';
import { CreateInvoiceDto } from '@application/dtos/invoice/invoice.dto';
import { MainAuthGuard } from '../http/guards/main-auth.guard';
import { RolesGuard } from '../http/guards/roles.guard';
import { Roles } from '../http/decorators/roles.decorator';
import { CurrentUser } from '../http/decorators/current-user.decorator';
import { JwtPayload } from '@application/use-cases/auth/auth.use-case';
import { UserRole } from '@domain/enums/user-role.enum';
import { InvoiceStatus } from '@domain/enums/invoice-status.enum';

@ApiTags('Invoices')
@ApiBearerAuth()
@UseGuards(MainAuthGuard, RolesGuard)
@Controller('invoices')
export class InvoiceController {
    constructor(
        private readonly createInvoice: CreateInvoiceUseCase,
        private readonly getInvoices: GetInvoicesUseCase,
        private readonly getInvoiceById: GetInvoiceByIdUseCase,
        private readonly sendToDian: SendToDianUseCase,
        private readonly cancelInvoice: CancelInvoiceUseCase,
    ) { }

    @Post()
    @Roles(UserRole.ADMIN, UserRole.OPERATOR, UserRole.ACCOUNTANT)
    @ApiOperation({ summary: 'Create a new invoice (DRAFT)' })
    create(@Body() dto: CreateInvoiceDto, @CurrentUser() user: JwtPayload) {
        return this.createInvoice.execute(dto, user.companyId);
    }

    @Get()
    @ApiOperation({ summary: 'List invoices with filters and pagination' })
    findAll(
        @CurrentUser() user: JwtPayload,
        @Query('status') status?: InvoiceStatus,
        @Query('from') from?: string,
        @Query('to') to?: string,
        @Query('customerId') customerId?: string,
        @Query('companyId') paramCompanyId?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        const targetCompanyId = (user.role === UserRole.SUPER_ADMIN && paramCompanyId) ? paramCompanyId : user.companyId;
        return this.getInvoices.execute(
            targetCompanyId,
            { status, from, to, customerId },
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 20,
        );
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get invoice by ID' })
    findOne(@Param('id') id: string, @Query('companyId') paramCompanyId: string, @CurrentUser() user: JwtPayload) {
        const targetCompanyId = (user.role === UserRole.SUPER_ADMIN && paramCompanyId) ? paramCompanyId : user.companyId;
        return this.getInvoiceById.execute(id, targetCompanyId);
    }

    @Post(':id/send-to-dian')
    @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Send invoice to DIAN (CUFE → XML → XAdES → SOAP)' })
    send(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
        return this.sendToDian.execute(id, user.companyId);
    }

    @Post(':id/cancel')
    @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Cancel an invoice' })
    cancel(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
        return this.cancelInvoice.execute(id, user.companyId);
    }
}
