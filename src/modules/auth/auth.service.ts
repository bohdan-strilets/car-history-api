import { ErrorCodes, UnauthorizedException } from '@common/exceptions';
import { parseDeviceName, parseIpAddress } from '@common/utils';
import { SessionsService } from '@modules/sessions/sessions.service';
import { CreateGoogleUserDto, CreateUserDto } from '@modules/users';
import { toUserResponse } from '@modules/users/mappers/user.mapper';
import { UsersService } from '@modules/users/users.service';
import { Injectable } from '@nestjs/common';
import { Request } from 'express';

import { AuthResult } from './auth.type';
import { LoginDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
  ) {}

  // ─── Register ─────────────────────────────────────────────────────────────

  async register(dto: CreateUserDto, req: Request): Promise<AuthResult> {
    const user = await this.usersService.createUser(dto);

    const rawToken = await this.usersService.createEmailVerificationToken(user.id, user.email);
    // TODO: send email via MailService

    const { accessToken, refreshToken } = await this.sessionsService.createSession({
      userId: user.id,
      deviceName: parseDeviceName(req),
      userAgent: req.headers['user-agent'],
      ipAddress: parseIpAddress(req),
    });

    return { accessToken, refreshToken, user: toUserResponse(user) };
  }

  // ─── Login ────────────────────────────────────────────────────────────────

  async login(dto: LoginDto, req: Request): Promise<AuthResult> {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException(ErrorCodes.Auth.INVALID_CREDENTIALS);
    }

    await this.usersService.validateStatus(user.id);
    await this.usersService.validatePassword(user.id, dto.password);

    const { accessToken, refreshToken } = await this.sessionsService.createSession({
      userId: user.id,
      deviceName: parseDeviceName(req),
      userAgent: req.headers['user-agent'],
      ipAddress: parseIpAddress(req),
    });

    return { accessToken, refreshToken, user: toUserResponse(user) };
  }

  // ─── Refresh ──────────────────────────────────────────────────────────────

  async refresh(rawRefreshToken: string): Promise<AuthResult> {
    const { accessToken, refreshToken, session } =
      await this.sessionsService.refreshSession(rawRefreshToken);

    const user = await this.usersService.getById(session.userId);

    return { accessToken, refreshToken, user: toUserResponse(user) };
  }

  // ─── Logout ───────────────────────────────────────────────────────────────

  async logout(sessionId: string): Promise<void> {
    await this.sessionsService.revokeSession(sessionId);
  }

  async logoutAll(userId: string): Promise<void> {
    await this.sessionsService.revokeAllSessions(userId);
  }

  // ─── Google OAuth ─────────────────────────────────────────────────────────

  async googleAuth(googleUser: CreateGoogleUserDto, req: Request): Promise<AuthResult> {
    const user = await this.usersService.createFromGoogle(googleUser);

    const { accessToken, refreshToken } = await this.sessionsService.createSession({
      userId: user.id,
      deviceName: parseDeviceName(req),
      userAgent: req.headers['user-agent'],
      ipAddress: parseIpAddress(req),
    });

    return { accessToken, refreshToken, user: toUserResponse(user) };
  }

  // ─── Email Verification ───────────────────────────────────────────────────

  async confirmEmail(token: string): Promise<void> {
    await this.usersService.verifyEmail(token);
  }

  async resendConfirmation(userId: string): Promise<void> {
    const user = await this.usersService.getById(userId);
    const rawToken = await this.usersService.createEmailVerificationToken(userId, user.email);
    // TODO: send email via MailService
  }

  // ─── Password Reset ───────────────────────────────────────────────────────

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) return;

    const rawToken = await this.usersService.createPasswordResetToken(user.id);
    // TODO: send email via MailService
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await this.usersService.resetPassword(token, newPassword);
  }
}
