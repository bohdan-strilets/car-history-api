import { ErrorCodes, UnauthorizedException } from '@common/exceptions';
import { AppConfigService } from '@config/config.service';
import { MailService } from '@modules/mail';
import { SessionsService } from '@modules/sessions/sessions.service';
import { CreateGoogleUserDto, CreateUserDto, UserResponseDto } from '@modules/users';
import { UsersService } from '@modules/users/users.service';
import { Test, TestingModule } from '@nestjs/testing';
import { UserStatus } from '@prisma/client';
import { Request } from 'express';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let sessionsService: jest.Mocked<SessionsService>;
  let mailService: jest.Mocked<MailService>;
  let config: jest.Mocked<AppConfigService>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    emailVerified: true,
    emailVerifiedAt: new Date(),
    status: UserStatus.ACTIVE,
    avatarUrl: null,
    lastLoginAt: new Date(),
    loginCount: 1,
    onboardingCompleted: true,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserResponse: UserResponseDto = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    status: UserStatus.ACTIVE,
    emailVerified: true,
    avatarUrl: null,
    onboardingCompleted: true,
    createdAt: new Date(),
  };

  const mockSession = {
    accessToken: 'access-token-123',
    refreshToken: 'refresh-token-123',
    session: {
      id: 'session-123',
      userId: 'user-123',
      tokenFamily: 'family-1',
      refreshTokenHash: 'hash',
      deviceName: 'Chrome',
      userAgent: 'Mozilla/5.0',
      ipAddress: '127.0.0.1',
      lastActivityAt: new Date(),
      expiresAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  const mockRequest = {
    headers: {
      'user-agent': 'Mozilla/5.0...',
    },
    socket: {
      remoteAddress: '127.0.0.1',
    },
  } as unknown as Request;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            createUser: jest.fn(),
            findByEmail: jest.fn(),
            getById: jest.fn(),
            createEmailVerificationToken: jest.fn(),
            createPasswordResetToken: jest.fn(),
            verifyEmail: jest.fn(),
            validateStatus: jest.fn(),
            validatePassword: jest.fn(),
            resetPassword: jest.fn(),
            createFromGoogle: jest.fn(),
          },
        },
        {
          provide: SessionsService,
          useValue: {
            createSession: jest.fn(),
            refreshSession: jest.fn(),
            revokeSession: jest.fn(),
            revokeAllSessions: jest.fn(),
          },
        },
        {
          provide: MailService,
          useValue: {
            sendConfirmEmail: jest.fn(),
            sendResetPassword: jest.fn(),
            sendReminderNotification: jest.fn(),
          },
        },
        {
          provide: AppConfigService,
          useValue: {
            frontendUrl: 'https://example.com',
            passwordResetExpiresInMinutes: 60,
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService) as jest.Mocked<UsersService>;
    sessionsService = module.get(SessionsService) as jest.Mocked<SessionsService>;
    mailService = module.get(MailService) as jest.Mocked<MailService>;
    config = module.get(AppConfigService) as jest.Mocked<AppConfigService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'password123',
      };

      usersService.createUser.mockResolvedValue(mockUser as any);
      usersService.createEmailVerificationToken.mockResolvedValue('verification-token');
      sessionsService.createSession.mockResolvedValue(mockSession as any);
      mailService.sendConfirmEmail.mockResolvedValue(undefined);

      const result = await service.register(createUserDto, mockRequest);

      expect(result).toEqual({
        accessToken: mockSession.accessToken,
        refreshToken: mockSession.refreshToken,
        user: mockUserResponse,
      });
      expect(usersService.createUser).toHaveBeenCalledWith(createUserDto);
      expect(usersService.createEmailVerificationToken).toHaveBeenCalledWith(
        mockUser.id,
        mockUser.email,
      );
      expect(mailService.sendConfirmEmail).toHaveBeenCalled();
      expect(sessionsService.createSession).toHaveBeenCalled();
    });

    it('should send confirmation email with correct URL', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'password123',
      };

      usersService.createUser.mockResolvedValue(mockUser as any);
      usersService.createEmailVerificationToken.mockResolvedValue('verification-token');
      sessionsService.createSession.mockResolvedValue(mockSession as any);
      mailService.sendConfirmEmail.mockResolvedValue(undefined);

      await service.register(createUserDto, mockRequest);

      expect(mailService.sendConfirmEmail).toHaveBeenCalledWith({
        to: mockUser.email,
        firstName: mockUser.firstName,
        confirmUrl: 'https://example.com/auth/confirm-email?token=verification-token',
      });
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      usersService.findByEmail.mockResolvedValue(mockUser as any);
      usersService.validateStatus.mockResolvedValue(undefined);
      usersService.validatePassword.mockResolvedValue(undefined);
      sessionsService.createSession.mockResolvedValue(mockSession as any);

      const result = await service.login(loginDto, mockRequest);

      expect(result).toEqual({
        accessToken: mockSession.accessToken,
        refreshToken: mockSession.refreshToken,
        user: mockUserResponse,
      });
      expect(usersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(usersService.validateStatus).toHaveBeenCalledWith(mockUser.id);
      expect(usersService.validatePassword).toHaveBeenCalledWith(mockUser.id, loginDto.password);
    });

    it('should throw error when user not found', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto, mockRequest)).rejects.toThrow(UnauthorizedException);
      expect(usersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
    });

    it('should validate user status before login', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      usersService.findByEmail.mockResolvedValue(mockUser as any);
      usersService.validateStatus.mockRejectedValue(new Error('User status invalid'));

      await expect(service.login(loginDto, mockRequest)).rejects.toThrow();
      expect(usersService.validateStatus).toHaveBeenCalled();
    });

    it('should validate password before login', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      usersService.findByEmail.mockResolvedValue(mockUser as any);
      usersService.validateStatus.mockResolvedValue(undefined);
      usersService.validatePassword.mockRejectedValue(new Error('Password incorrect'));

      await expect(service.login(loginDto, mockRequest)).rejects.toThrow();
      expect(usersService.validatePassword).toHaveBeenCalledWith(mockUser.id, loginDto.password);
    });
  });

  describe('refresh', () => {
    it('should refresh tokens successfully', async () => {
      const refreshToken = 'refresh-token-123';

      sessionsService.refreshSession.mockResolvedValue(mockSession as any);
      usersService.getById.mockResolvedValue(mockUser as any);

      const result = await service.refresh(refreshToken);

      expect(result).toEqual({
        accessToken: mockSession.accessToken,
        refreshToken: mockSession.refreshToken,
        user: mockUserResponse,
      });
      expect(sessionsService.refreshSession).toHaveBeenCalledWith(refreshToken);
      expect(usersService.getById).toHaveBeenCalledWith(mockSession.session.userId);
    });

    it('should throw error on invalid refresh token', async () => {
      const refreshToken = 'invalid-token';

      sessionsService.refreshSession.mockRejectedValue(
        new UnauthorizedException(ErrorCodes.Auth.INVALID_CREDENTIALS),
      );

      await expect(service.refresh(refreshToken)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('me', () => {
    it('should return current user info', async () => {
      const userId = 'user-123';

      usersService.getById.mockResolvedValue(mockUser as any);

      const result = await service.me(userId);

      expect(result).toEqual(mockUserResponse);
      expect(usersService.getById).toHaveBeenCalledWith(userId);
    });
  });

  describe('logout', () => {
    it('should revoke session successfully', async () => {
      const sessionId = 'session-123';

      sessionsService.revokeSession.mockResolvedValue(undefined);

      await service.logout(sessionId);

      expect(sessionsService.revokeSession).toHaveBeenCalledWith(sessionId);
    });
  });

  describe('logoutAll', () => {
    it('should revoke all user sessions', async () => {
      const userId = 'user-123';

      sessionsService.revokeAllSessions.mockResolvedValue(undefined);

      await service.logoutAll(userId);

      expect(sessionsService.revokeAllSessions).toHaveBeenCalledWith(userId);
    });
  });

  describe('googleAuth', () => {
    it('should authenticate user via Google OAuth', async () => {
      const googleUserDto: CreateGoogleUserDto = {
        email: 'test@gmail.com',
        firstName: 'John',
        lastName: 'Doe',
        avatarUrl: 'https://example.com/avatar.jpg',
      };

      usersService.createFromGoogle.mockResolvedValue(mockUser as any);
      sessionsService.createSession.mockResolvedValue(mockSession as any);

      const result = await service.googleAuth(googleUserDto, mockRequest);

      expect(result).toEqual({
        accessToken: mockSession.accessToken,
        refreshToken: mockSession.refreshToken,
        user: mockUserResponse,
      });
      expect(usersService.createFromGoogle).toHaveBeenCalledWith(googleUserDto);
      expect(sessionsService.createSession).toHaveBeenCalled();
    });
  });

  describe('confirmEmail', () => {
    it('should verify email token', async () => {
      const token = 'email-verification-token';

      usersService.verifyEmail.mockResolvedValue(undefined);

      await service.confirmEmail(token);

      expect(usersService.verifyEmail).toHaveBeenCalledWith(token);
    });

    it('should throw error on invalid token', async () => {
      const token = 'invalid-token';

      usersService.verifyEmail.mockRejectedValue(new Error('Token expired or invalid'));

      await expect(service.confirmEmail(token)).rejects.toThrow();
    });
  });

  describe('resendConfirmation', () => {
    it('should resend confirmation email', async () => {
      const userId = 'user-123';

      usersService.getById.mockResolvedValue(mockUser as any);
      usersService.createEmailVerificationToken.mockResolvedValue('new-verification-token');
      mailService.sendConfirmEmail.mockResolvedValue(undefined);

      await service.resendConfirmation(userId);

      expect(usersService.getById).toHaveBeenCalledWith(userId);
      expect(usersService.createEmailVerificationToken).toHaveBeenCalledWith(
        userId,
        mockUser.email,
      );
      expect(mailService.sendConfirmEmail).toHaveBeenCalledWith({
        to: mockUser.email,
        firstName: mockUser.firstName,
        confirmUrl: 'https://example.com/auth/confirm-email?token=new-verification-token',
      });
    });
  });

  describe('forgotPassword', () => {
    it('should send password reset email', async () => {
      const email = 'test@example.com';

      usersService.findByEmail.mockResolvedValue(mockUser as any);
      usersService.createPasswordResetToken.mockResolvedValue('reset-token');
      mailService.sendResetPassword.mockResolvedValue(undefined);

      await service.forgotPassword(email);

      expect(usersService.findByEmail).toHaveBeenCalledWith(email);
      expect(usersService.createPasswordResetToken).toHaveBeenCalledWith(mockUser.id);
      expect(mailService.sendResetPassword).toHaveBeenCalledWith({
        to: mockUser.email,
        firstName: mockUser.firstName,
        resetUrl: 'https://example.com/auth/reset-password?token=reset-token',
        expiresInMinutes: 60,
      });
    });

    it('should not throw error when user not found (for security)', async () => {
      const email = 'nonexistent@example.com';

      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.forgotPassword(email)).resolves.not.toThrow();
      expect(mailService.sendResetPassword).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      const token = 'reset-token';
      const newPassword = 'newpassword123';

      usersService.resetPassword.mockResolvedValue(undefined);

      await service.resetPassword(token, newPassword);

      expect(usersService.resetPassword).toHaveBeenCalledWith(token, newPassword);
    });

    it('should throw error on invalid reset token', async () => {
      const token = 'invalid-token';
      const newPassword = 'newpassword123';

      usersService.resetPassword.mockRejectedValue(new Error('Token expired'));

      await expect(service.resetPassword(token, newPassword)).rejects.toThrow();
    });
  });
});
