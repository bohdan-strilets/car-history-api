import { AUTH_RATE_LIMIT_OPTIONS } from '@common/decorators';
import { ErrorCodes } from '@common/exceptions';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { AuthRateLimitGuard } from './auth-rate-limit.guard';

describe('AuthRateLimitGuard', () => {
  const createContext = (body: Record<string, unknown> = {}): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'POST',
          route: { path: '/auth/login' },
          path: '/auth/login',
          ip: '127.0.0.1',
          body,
        }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    }) as ExecutionContext;

  it('блокує brute-force після перевищення ліміту', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue({
        limit: 2,
        windowMs: 1000,
        blockMs: 2000,
        keyByEmail: true,
      }),
    } as unknown as Reflector;

    const guard = new AuthRateLimitGuard(reflector);
    const context = createContext({ email: 'user@example.com' });

    expect(guard.canActivate(context)).toBe(true);
    expect(guard.canActivate(context)).toBe(true);

    expect(() => guard.canActivate(context)).toThrowError(
      expect.objectContaining({
        errorCode: ErrorCodes.General.TOO_MANY_REQUESTS,
      }),
    );
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(AUTH_RATE_LIMIT_OPTIONS, [
      expect.any(Object),
      expect.any(Object),
    ]);
  });
});
