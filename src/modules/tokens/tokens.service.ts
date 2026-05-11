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
    });
  }

  verifyAccessToken(token: string): JwtAccessPayload {
    try {
      return this.jwt.verify<JwtAccessPayload>(token, {
        secret: this.config.jwtAccessSecret,
      });
    } catch {
      throw new UnauthorizedException('ACCESS_TOKEN_INVALID');
    }
  }

  signRefreshToken(payload: JwtRefreshPayload): string {
    return this.jwt.sign(payload, {
      secret: this.config.jwtRefreshSecret,
      expiresIn: this.config.jwtRefreshExpiresIn,
    });
  }

  verifyRefreshToken(token: string): JwtRefreshPayload {
    try {
      return this.jwt.verify<JwtRefreshPayload>(token, {
        secret: this.config.jwtRefreshSecret,
      });
    } catch {
      throw new UnauthorizedException('REFRESH_TOKEN_INVALID');
    }
  }

  decode<T extends JwtAccessPayload | JwtRefreshPayload>(token: string): T | null {
    return this.jwt.decode<T>(token);
  }
}
