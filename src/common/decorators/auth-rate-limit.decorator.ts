import { SetMetadata } from '@nestjs/common';

export interface AuthRateLimitOptions {
  limit: number;
  windowMs: number;
  blockMs: number;
  keyByEmail: boolean;
}

export const AUTH_RATE_LIMIT_OPTIONS = 'auth-rate-limit-options';

export const AuthRateLimit = (options: AuthRateLimitOptions) =>
  SetMetadata(AUTH_RATE_LIMIT_OPTIONS, options);
