import {
  clearRefreshTokenCookie,
  getRefreshTokenFromCookie,
  setRefreshTokenCookie,
} from '@common/cookie';
import { Auth, CurrentSessionId, CurrentUserId, GoogleAuth, GoogleUser } from '@common/decorators';
import { ErrorCodes, UnauthorizedException } from '@common/exceptions';
import { AppConfigService } from '@config/config.service';
import { CreateGoogleUserDto, UserResponseDto } from '@modules/users';
import { CreateUserDto } from '@modules/users/dto/create-user.dto';
import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';

import { AuthService } from './auth.service';
import { AuthResponseDto, ConfirmEmailDto, ForgotPasswordDto, ResetPasswordDto } from './dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: AppConfigService,
  ) {}

  @Post('register')
  async register(
    @Body() dto: CreateUserDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.register(dto, req);
    setRefreshTokenCookie(res, result.refreshToken, this.config);
    return { accessToken: result.accessToken, user: result.user };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.login(dto, req);
    setRefreshTokenCookie(res, result.refreshToken, this.config);
    return { accessToken: result.accessToken, user: result.user };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const refreshToken = getRefreshTokenFromCookie(req);

    if (!refreshToken) {
      throw new UnauthorizedException(ErrorCodes.Auth.REFRESH_TOKEN_INVALID);
    }

    const result = await this.authService.refresh(refreshToken);
    setRefreshTokenCookie(res, result.refreshToken, this.config);
    return { accessToken: result.accessToken, user: result.user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth()
  async logout(
    @CurrentSessionId() sessionId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.authService.logout(sessionId);
    clearRefreshTokenCookie(res, this.config);
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
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<void> {
    await this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    await this.authService.resetPassword(dto.token, dto.password);
  }

  @Get('google')
  @GoogleAuth()
  googleAuth(): void {}

  @Get('google/callback')
  @GoogleAuth()
  async googleCallback(
    @GoogleUser() googleUser: CreateGoogleUserDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.googleAuth(googleUser, req);
    setRefreshTokenCookie(res, result.refreshToken, this.config);
    return { accessToken: result.accessToken, user: result.user };
  }

  @Get('me')
  @Auth()
  async me(@CurrentUserId() userId: string): Promise<UserResponseDto> {
    return this.authService.me(userId);
  }
}
