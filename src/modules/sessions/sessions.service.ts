import { randomUUID } from 'node:crypto';

import { CryptoService } from '@common/crypto';
import { ErrorCodes, UnauthorizedException } from '@common/exceptions';
import { AppConfigService } from '@config/config.service';
import { TokensService } from '@modules/tokens/tokens.service';
import { Injectable } from '@nestjs/common';
import ms from 'ms';

import { CreateSessionOptions, RefreshSessionResult } from './session.type';
import { SessionsRepository } from './sessions.repository';

@Injectable()
export class SessionsService {
  constructor(
    private readonly sessionsRepo: SessionsRepository,
    private readonly tokens: TokensService,
    private readonly crypto: CryptoService,
    private readonly config: AppConfigService,
  ) {}

  // ─── Create ───────────────────────────────────────────────────────────────

  async createSession(options: CreateSessionOptions): Promise<RefreshSessionResult> {
    const sessionId = randomUUID();
    const tokenFamily = this.crypto.generateTokenFamily();

    const refreshToken = this.tokens.signRefreshToken({
      sub: options.userId,
      sessionId: sessionId,
      tokenFamily,
    });
    const accessToken = this.tokens.signAccessToken({
      sub: options.userId,
      sessionId: sessionId,
    });

    const refreshTokenHash = this.crypto.hashToken(refreshToken);

    const session = await this.sessionsRepo.create({
      id: sessionId,
      userId: options.userId,
      tokenFamily,
      refreshTokenHash,
      deviceName: options.deviceName,
      userAgent: options.userAgent,
      ipAddress: options.ipAddress,
      expiresAt: this.getExpiresAt(),
    });

    return { accessToken, refreshToken, session };
  }

  // ─── Refresh ──────────────────────────────────────────────────────────────

  async refreshSession(rawRefreshToken: string): Promise<RefreshSessionResult> {
    const payload = this.tokens.verifyRefreshToken(rawRefreshToken);

    const session = await this.sessionsRepo.findByTokenFamily(payload.tokenFamily);

    if (!session) {
      throw new UnauthorizedException(ErrorCodes.Auth.SESSION_NOT_FOUND);
    }

    const isTokenBoundToSession =
      session.id === payload.sessionId && session.userId === payload.sub;
    if (!isTokenBoundToSession) {
      await this.sessionsRepo.revokeByTokenFamily(payload.tokenFamily);
      throw new UnauthorizedException(ErrorCodes.Auth.REFRESH_TOKEN_INVALID);
    }

    const tokenHash = this.crypto.hashToken(rawRefreshToken);
    if (session.refreshTokenHash !== tokenHash) {
      await this.sessionsRepo.revokeByTokenFamily(payload.tokenFamily);
      throw new UnauthorizedException(ErrorCodes.Auth.REFRESH_TOKEN_REUSE);
    }

    if (session.status !== 'ACTIVE') {
      throw new UnauthorizedException(ErrorCodes.Auth.SESSION_REVOKED);
    }

    if (session.expiresAt < new Date()) {
      throw new UnauthorizedException(ErrorCodes.Auth.SESSION_EXPIRED);
    }

    const accessToken = this.tokens.signAccessToken({
      sub: session.userId,
      sessionId: session.id,
    });
    const newRawRefreshToken = this.tokens.signRefreshToken({
      sub: session.userId,
      sessionId: session.id,
      tokenFamily: payload.tokenFamily,
    });

    const newRefreshTokenHash = this.crypto.hashToken(newRawRefreshToken);

    await this.sessionsRepo.update(session.id, {
      refreshTokenHash: newRefreshTokenHash,
      lastActivityAt: new Date(),
      expiresAt: this.getExpiresAt(),
    });

    return { accessToken, refreshToken: newRawRefreshToken, session };
  }

  // ─── Revoke ───────────────────────────────────────────────────────────────

  async revokeSession(sessionId: string): Promise<void> {
    await this.sessionsRepo.revoke(sessionId);
  }

  async revokeAllSessions(userId: string): Promise<void> {
    await this.sessionsRepo.revokeAllByUserId(userId);
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private getExpiresAt() {
    return new Date(Date.now() + ms(this.config.jwtRefreshExpiresIn));
  }
}
