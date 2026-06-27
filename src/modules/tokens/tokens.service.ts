import { AppConfigService } from '@config/config.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { JwtAccessPayload, JwtRefreshPayload } from './tokens.types';

@Injectable()
export class TokensService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: AppConfigService,
  ) {}

  signAccessToken(payload: JwtAccessPayload): string {
    return this.jwt.sign(payload, {
      secret: this.config.jwtAccessSecret,
      expiresIn: this.config.jwtAccessExpiresIn,
      issuer: this.config.jwtIssuer,
      audience: this.config.jwtAudience,
    });
  }

  verifyAccessToken(token: string): JwtAccessPayload {
    const secrets = [this.config.jwtAccessSecret, ...this.config.jwtAccessPreviousSecrets];
    return this.verifyWithSecrets<JwtAccessPayload>(token, secrets, 'ACCESS_TOKEN_INVALID');
  }

  signRefreshToken(payload: JwtRefreshPayload): string {
    return this.jwt.sign(payload, {
      secret: this.config.jwtRefreshSecret,
      expiresIn: this.config.jwtRefreshExpiresIn,
      issuer: this.config.jwtIssuer,
      audience: this.config.jwtAudience,
    });
  }

  verifyRefreshToken(token: string): JwtRefreshPayload {
    const secrets = [this.config.jwtRefreshSecret, ...this.config.jwtRefreshPreviousSecrets];
    return this.verifyWithSecrets<JwtRefreshPayload>(token, secrets, 'REFRESH_TOKEN_INVALID');
  }

  decode<T extends JwtAccessPayload | JwtRefreshPayload>(token: string): T | null {
    return this.jwt.decode<T>(token);
  }

  private verifyWithSecrets<T extends JwtAccessPayload | JwtRefreshPayload>(
    token: string,
    secrets: string[],
    errorCode: string,
  ): T {
    for (const secret of secrets) {
      try {
        return this.jwt.verify<T>(token, {
          secret,
          issuer: this.config.jwtIssuer,
          audience: this.config.jwtAudience,
        });
      } catch {
        // try next secret
      }
    }

    throw new UnauthorizedException(errorCode);
  }
}
