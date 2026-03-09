import {
    Controller, Post, Body, HttpCode, HttpStatus, Get, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LoginUseCase, LogoutUseCase, SetupSuperAdminUseCase, CheckSetupUseCase } from '@application/use-cases/auth/auth.use-case';
import { LoginDto, SetupSuperAdminDto } from '@application/dtos/auth/auth.dto';
import { JwtAuthGuard } from '../http/guards/jwt-auth.guard';
import { CurrentUser } from '../http/decorators/current-user.decorator';
import { JwtPayload } from '@application/use-cases/auth/auth.use-case';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly loginUseCase: LoginUseCase,
        private readonly logoutUseCase: LogoutUseCase,
        private readonly setupUseCase: SetupSuperAdminUseCase,
        private readonly checkSetupUseCase: CheckSetupUseCase,
    ) { }

    @Get('setup-status')
    @ApiOperation({ summary: 'Check if the system is already initialized' })
    async setupStatus() {
        return this.checkSetupUseCase.execute();
    }

    @Post('setup')
    @ApiOperation({ summary: 'Initial setup of the SuperAdmin' })
    async setup(@Body() dto: SetupSuperAdminDto) {
        return this.setupUseCase.execute(dto);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Authenticate and get JWT tokens' })
    async login(@Body() dto: LoginDto) {
        return this.loginUseCase.execute(dto);
    }

    @Post('logout')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Logout - invalidate refresh token' })
    async logout(@CurrentUser() user: JwtPayload) {
        await this.logoutUseCase.execute(user.sub);
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user info from JWT' })
    me(@CurrentUser() user: JwtPayload) {
        return user;
    }
}
