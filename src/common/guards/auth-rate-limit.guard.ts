import { SECURITY } from '@common/constants';
import { AUTH_RATE_LIMIT_OPTIONS, AuthRateLimitOptions } from '@common/decorators';
import { AppException, ErrorCodes } from '@common/exceptions';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

interface AuthRateLimitState {
  count: number;
  windowStartedAt: number;
  blockedUntil?: number;
}

@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  private readonly attempts = new Map<string, AuthRateLimitState>();

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.getAllAndOverride<AuthRateLimitOptions>(
      AUTH_RATE_LIMIT_OPTIONS,
      [context.getHandler(), context.getClass()],
    );

    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const key = this.buildKey(request, options);
    const now = Date.now();
    const current = this.attempts.get(key) ?? { count: 0, windowStartedAt: now };

    if (current.blockedUntil && current.blockedUntil > now) {
      throw this.createRateLimitException(current.blockedUntil, now);
    }

    if (now - current.windowStartedAt >= options.windowMs) {
      current.count = 0;
      current.windowStartedAt = now;
      current.blockedUntil = undefined;
    }

    current.count += 1;

    if (current.count > options.limit) {
      current.blockedUntil = now + options.blockMs;
      this.attempts.set(key, current);
      throw this.createRateLimitException(current.blockedUntil, now);
    }

    this.attempts.set(key, current);
    this.cleanupExpiredEntries(now);
    return true;
  }

  private createRateLimitException(blockedUntil: number, now: number): AppException {
    const retryAfterSeconds = Math.max(1, Math.ceil((blockedUntil - now) / 1000));
    return new AppException({
      statusCode: 429,
      errorCode: ErrorCodes.General.TOO_MANY_REQUESTS,
      details: {
        retryAfterSeconds,
      },
    });
  }

  private buildKey(request: Request, options: AuthRateLimitOptions): string {
    const routePath = request.route?.path ?? request.path;
    const routeKey = `${request.method}:${routePath}`;
    const ip = request.ip ?? request.socket.remoteAddress ?? 'unknown';

    if (!options.keyByEmail) {
      return `${routeKey}:${ip}`;
    }

    const emailRaw = request.body?.email;
    const email = typeof emailRaw === 'string' ? emailRaw.toLowerCase().trim() : 'no-email';
    return `${routeKey}:${ip}:${email}`;
  }

  private cleanupExpiredEntries(now: number): void {
    for (const [key, state] of this.attempts.entries()) {
      const windowExpired =
        now - state.windowStartedAt > 24 * SECURITY.AUTH_RATE_LIMITS.LOGIN.windowMs;
      const blockExpired = !state.blockedUntil || state.blockedUntil <= now;
      if (windowExpired && blockExpired) {
        this.attempts.delete(key);
      }
    }
  }
}
