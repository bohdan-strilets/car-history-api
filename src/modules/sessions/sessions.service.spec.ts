import { CryptoService } from '@common/crypto';
import { ErrorCodes } from '@common/exceptions';
import { AppConfigService } from '@config/config.service';
import { TokensService } from '@modules/tokens/tokens.service';

import { SessionsRepository } from './sessions.repository';
import { SessionsService } from './sessions.service';

describe('SessionsService security', () => {
  let service: SessionsService;
  let sessionsRepo: jest.Mocked<SessionsRepository>;
  let tokens: jest.Mocked<TokensService>;
  let crypto: jest.Mocked<CryptoService>;
  let config: jest.Mocked<AppConfigService>;

  beforeEach(() => {
    sessionsRepo = {
      findByTokenFamily: jest.fn(),
      revokeByTokenFamily: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      revoke: jest.fn(),
      revokeAllByUserId: jest.fn(),
    } as unknown as jest.Mocked<SessionsRepository>;

    tokens = {
      verifyRefreshToken: jest.fn(),
      signAccessToken: jest.fn(),
      signRefreshToken: jest.fn(),
    } as unknown as jest.Mocked<TokensService>;

    crypto = {
      hashToken: jest.fn(),
      generateTokenFamily: jest.fn(),
    } as unknown as jest.Mocked<CryptoService>;

    config = {
      jwtRefreshExpiresIn: '30d',
    } as unknown as jest.Mocked<AppConfigService>;

    service = new SessionsService(sessionsRepo, tokens, crypto, config);
  });

  it('детектить token replay/reuse і ревокує всю token family', async () => {
    tokens.verifyRefreshToken.mockReturnValue({
      sub: 'user-1',
      sessionId: 'session-1',
      tokenFamily: 'family-1',
    });
    sessionsRepo.findByTokenFamily.mockResolvedValue({
      id: 'session-1',
      userId: 'user-1',
      tokenFamily: 'family-1',
      refreshTokenHash: 'expected-hash',
      status: 'ACTIVE',
      expiresAt: new Date(Date.now() + 60000),
    } as any);
    crypto.hashToken.mockReturnValue('different-hash');

    await expect(service.refreshSession('raw-token')).rejects.toMatchObject({
      errorCode: ErrorCodes.Auth.REFRESH_TOKEN_REUSE,
    });
    expect(sessionsRepo.revokeByTokenFamily).toHaveBeenCalledWith('family-1');
  });

  it('блокує refresh якщо payload не збігається з session binding', async () => {
    tokens.verifyRefreshToken.mockReturnValue({
      sub: 'user-1',
      sessionId: 'session-999',
      tokenFamily: 'family-1',
    });
    sessionsRepo.findByTokenFamily.mockResolvedValue({
      id: 'session-1',
      userId: 'user-1',
      tokenFamily: 'family-1',
      refreshTokenHash: 'expected-hash',
      status: 'ACTIVE',
      expiresAt: new Date(Date.now() + 60000),
    } as any);
    crypto.hashToken.mockReturnValue('expected-hash');

    await expect(service.refreshSession('raw-token')).rejects.toMatchObject({
      errorCode: ErrorCodes.Auth.REFRESH_TOKEN_INVALID,
    });
    expect(sessionsRepo.revokeByTokenFamily).toHaveBeenCalledWith('family-1');
  });
});
