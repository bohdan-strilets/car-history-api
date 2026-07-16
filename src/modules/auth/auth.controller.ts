import { AuditLogService } from '@common/audit';
import { SECURITY } from '@common/constants';
import {
  clearCsrfTokenCookie,
  clearRefreshTokenCookie,
  createCsrfToken,
  getRefreshTokenFromCookie,
  setCsrfTokenCookie,
  setRefreshTokenCookie,
} from '@common/cookie';
import {
  Auth,
  AuthRateLimit,
  CurrentSessionId,
  CurrentUserId,
  GoogleAuth,
  GoogleUser,
} from '@common/decorators';
import { ErrorCodes, UnauthorizedException } from '@common/exceptions';
import { AuthCsrfGuard, AuthRateLimitGuard } from '@common/guards';
import { AppConfigService } from '@config/config.service';
import { CreateGoogleUserDto, UserResponseDto } from '@modules/users';
import { CreateUserDto } from '@modules/users/dto/create-user.dto';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { AuthService } from './auth.service';
import { AuthResponseDto, ConfirmEmailDto, ForgotPasswordDto, ResetPasswordDto } from './dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: AppConfigService,
    private readonly auditLog: AuditLogService,
  ) {}

  @Post('register')
  async register(
    @Body() dto: CreateUserDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.register(dto, req);
    const csrfToken = this.setAuthCookies(res, result.refreshToken);
    this.auditLog.log({ action: 'auth.register', userId: result.user.id, req });
    return { accessToken: result.accessToken, user: result.user, csrfToken };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthRateLimitGuard)
  @AuthRateLimit(SECURITY.AUTH_RATE_LIMITS.LOGIN)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.login(dto, req);
    const csrfToken = this.setAuthCookies(res, result.refreshToken);
    this.auditLog.log({ action: 'auth.login', userId: result.user.id, req });
    return { accessToken: result.accessToken, user: result.user, csrfToken };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthCsrfGuard, AuthRateLimitGuard)
  @AuthRateLimit(SECURITY.AUTH_RATE_LIMITS.REFRESH)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const refreshToken = getRefreshTokenFromCookie(req);

    if (!refreshToken) {
      throw new UnauthorizedException(ErrorCodes.Auth.REFRESH_TOKEN_INVALID);
    }

    const result = await this.authService.refresh(refreshToken);
    const csrfToken = this.setAuthCookies(res, result.refreshToken);
    this.auditLog.log({ action: 'auth.refresh', userId: result.user.id, req });
    return { accessToken: result.accessToken, user: result.user, csrfToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth()
  async logout(
    @CurrentSessionId() sessionId: string,
    @CurrentUserId() userId: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.authService.logout(sessionId);
    clearRefreshTokenCookie(res, this.config);
    clearCsrfTokenCookie(res, this.config);
    this.auditLog.log({
      action: 'auth.logout',
      userId,
      req,
      metadata: { sessionId },
    });
  }

  @Post('confirm-email')
  @HttpCode(HttpStatus.NO_CONTENT)
  async confirmEmail(@Body() dto: ConfirmEmailDto): Promise<void> {
    await this.authService.confirmEmail(dto.token);
  }

  @Post('resend-confirmation')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth()
  async resendConfirmation(@CurrentUserId() userId: string): Promise<void> {
    await this.authService.resendConfirmation(userId);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AuthRateLimitGuard)
  @AuthRateLimit(SECURITY.AUTH_RATE_LIMITS.PASSWORD_RESET)
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: Request): Promise<void> {
    await this.authService.forgotPassword(dto.email);
    this.auditLog.log({
      action: 'auth.forgot-password',
      req,
      metadata: { email: dto.email },
    });
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AuthRateLimitGuard)
  @AuthRateLimit(SECURITY.AUTH_RATE_LIMITS.PASSWORD_RESET)
  async resetPassword(@Body() dto: ResetPasswordDto, @Req() req: Request): Promise<void> {
    await this.authService.resetPassword(dto.token, dto.password);
    this.auditLog.log({
      action: 'auth.reset-password',
      req,
    });
  }

  @Get('google')
  @GoogleAuth()
  googleAuth(): void {}

  @Get('google/callback')
  @GoogleAuth()
  async googleCallback(
    @GoogleUser() googleUser: CreateGoogleUserDto,
    @Res() res: Response,
    @Req() req: Request,
  ): Promise<void> {
    const result = await this.authService.googleAuth(googleUser, req);
    const csrfToken = this.setAuthCookies(res, result.refreshToken);

    const redirectUrl = `${this.config.frontendUrl}/auth/google/callback?accessToken=${result.accessToken}&csrfToken=${csrfToken}`;

    res.redirect(redirectUrl);
  }

  @Get('me')
  @Auth()
  async me(@CurrentUserId() userId: string): Promise<UserResponseDto> {
    return this.authService.me(userId);
  }

  private setAuthCookies(res: Response, refreshToken: string): string {
    const csrfToken = createCsrfToken();
    setRefreshTokenCookie(res, refreshToken, this.config);
    setCsrfTokenCookie(res, csrfToken, this.config);
    return csrfToken;
  }
}
