import { CryptoService } from '@common/crypto';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@common/exceptions';
import { AppConfigService } from '@config/config.service';
import { Test, TestingModule } from '@nestjs/testing';
import { UserStatus } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';

import { AuthCredentialsRepo } from './auth-credentials.repository';
import { CreateGoogleUserDto, CreateUserDto } from './dto';
import { EmailVerifyTokenRepo } from './email-verify-token.repository';
import { PasswordResetTokenRepo } from './password-reset-token.repository';
import { UserSettingsRepo } from './user-settings.repository';
import { UsersRepo } from './users.repository';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let usersRepo: jest.Mocked<UsersRepo>;
  let emailVerifyTokenRepo: jest.Mocked<EmailVerifyTokenRepo>;
  let passwordResetTokenRepo: jest.Mocked<PasswordResetTokenRepo>;
  let authCredentialsRepo: jest.Mocked<AuthCredentialsRepo>;
  let userSettingsRepo: jest.Mocked<UserSettingsRepo>;
  let crypto: jest.Mocked<CryptoService>;
  let config: jest.Mocked<AppConfigService>;
  let prisma: jest.Mocked<PrismaService>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    status: UserStatus.ACTIVE,
    emailVerified: true,
    emailVerifiedAt: new Date(),
    onboardingCompleted: true,
    avatarUrl: null,
    lastLoginAt: new Date(),
    loginCount: 1,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepo,
          useValue: {
            findById: jest.fn(),
            findByEmail: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            updateLastLogin: jest.fn(),
            markEmailVerified: jest.fn(),
            completeOnboarding: jest.fn(),
          },
        },
        {
          provide: EmailVerifyTokenRepo,
          useValue: {
            create: jest.fn(),
            findByTokenHash: jest.fn(),
            markUsed: jest.fn(),
          },
        },
        {
          provide: PasswordResetTokenRepo,
          useValue: {
            create: jest.fn(),
            findByTokenHash: jest.fn(),
            markUsed: jest.fn(),
          },
        },
        {
          provide: AuthCredentialsRepo,
          useValue: {
            create: jest.fn(),
            findByUserId: jest.fn(),
            resetFailedAttempts: jest.fn(),
            incrementFailedAttempts: jest.fn(),
            updatePassword: jest.fn(),
          },
        },
        {
          provide: UserSettingsRepo,
          useValue: {
            create: jest.fn(),
            findByUserId: jest.fn(),
          },
        },
        {
          provide: CryptoService,
          useValue: {
            hashPassword: jest.fn(),
            comparePassword: jest.fn(),
            generateToken: jest.fn(),
            hashToken: jest.fn(),
          },
        },
        {
          provide: AppConfigService,
          useValue: {
            frontendUrl: 'https://example.com',
            passwordResetExpiresInMinutes: 60,
          },
        },
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    usersRepo = module.get(UsersRepo) as jest.Mocked<UsersRepo>;
    emailVerifyTokenRepo = module.get(EmailVerifyTokenRepo) as jest.Mocked<EmailVerifyTokenRepo>;
    passwordResetTokenRepo = module.get(
      PasswordResetTokenRepo,
    ) as jest.Mocked<PasswordResetTokenRepo>;
    authCredentialsRepo = module.get(AuthCredentialsRepo) as jest.Mocked<AuthCredentialsRepo>;
    userSettingsRepo = module.get(UserSettingsRepo) as jest.Mocked<UserSettingsRepo>;
    crypto = module.get(CryptoService) as jest.Mocked<CryptoService>;
    config = module.get(AppConfigService) as jest.Mocked<AppConfigService>;
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getById', () => {
    it('should return user by id', async () => {
      usersRepo.findById.mockResolvedValue(mockUser as any);

      const result = await service.getById('user-123');

      expect(result).toEqual(mockUser);
      expect(usersRepo.findById).toHaveBeenCalledWith('user-123');
    });

    it('should throw NotFoundException when user not found', async () => {
      usersRepo.findById.mockResolvedValue(null);

      await expect(service.getById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      usersRepo.findByEmail.mockResolvedValue(mockUser as any);

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(usersRepo.findByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should return null when user not found', async () => {
      usersRepo.findByEmail.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    it('should create a new user with all required data', async () => {
      const createUserDto: CreateUserDto = {
        email: 'newuser@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        password: 'password123',
      };

      const passwordHash = 'hashed-password';
      usersRepo.findByEmail.mockResolvedValue(null);
      crypto.hashPassword.mockResolvedValue(passwordHash);
      usersRepo.create.mockResolvedValue(mockUser as any);
      authCredentialsRepo.create.mockResolvedValue(undefined);
      userSettingsRepo.create.mockResolvedValue({} as any);

      prisma.$transaction.mockImplementation(async (callback: any) => {
        return callback({});
      });

      const result = await service.createUser(createUserDto);

      expect(result).toEqual(mockUser);
      expect(usersRepo.findByEmail).toHaveBeenCalled();
      expect(crypto.hashPassword).toHaveBeenCalledWith(createUserDto.password);
      expect(usersRepo.create).toHaveBeenCalled();
      expect(authCredentialsRepo.create).toHaveBeenCalled();
      expect(userSettingsRepo.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        password: 'password123',
      };

      usersRepo.findByEmail.mockResolvedValue(mockUser as any);

      await expect(service.createUser(createUserDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('createFromGoogle', () => {
    it('should create new user from Google OAuth', async () => {
      const googleUserDto: CreateGoogleUserDto = {
        email: 'test@gmail.com',
        firstName: 'John',
        lastName: 'Doe',
        avatarUrl: 'https://example.com/avatar.jpg',
      };

      usersRepo.findByEmail.mockResolvedValue(null);
      usersRepo.create.mockResolvedValue({ ...mockUser, emailVerified: true } as any);
      authCredentialsRepo.create.mockResolvedValue(undefined);
      userSettingsRepo.create.mockResolvedValue({} as any);

      prisma.$transaction.mockImplementation(async (callback: any) => {
        return callback({});
      });

      const result = await service.createFromGoogle(googleUserDto);

      expect(result.emailVerified).toBe(true);
      expect(usersRepo.create).toHaveBeenCalled();
    });

    it('should return existing user if email already registered', async () => {
      const googleUserDto: CreateGoogleUserDto = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        avatarUrl: 'https://example.com/avatar.jpg',
      };

      usersRepo.findByEmail.mockResolvedValue(mockUser as any);

      const result = await service.createFromGoogle(googleUserDto);

      expect(result).toEqual(mockUser);
      expect(usersRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('validatePassword', () => {
    it('should validate correct password', async () => {
      const password = 'password123';
      const credentials = {
        userId: 'user-123',
        passwordHash: 'hashed-password',
        failedLoginAttempts: 0,
        lockedUntil: null,
      };

      authCredentialsRepo.findByUserId.mockResolvedValue(credentials as any);
      crypto.comparePassword.mockResolvedValue(true);
      authCredentialsRepo.resetFailedAttempts.mockResolvedValue(undefined);
      usersRepo.updateLastLogin.mockResolvedValue(undefined);

      await expect(service.validatePassword('user-123', password)).resolves.not.toThrow();
      expect(authCredentialsRepo.resetFailedAttempts).toHaveBeenCalledWith('user-123');
      expect(usersRepo.updateLastLogin).toHaveBeenCalledWith('user-123');
    });

    it('should throw error if no password hash exists', async () => {
      authCredentialsRepo.findByUserId.mockResolvedValue(null);

      await expect(service.validatePassword('user-123', 'password')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw error if account is locked', async () => {
      const futureDate = new Date(Date.now() + 60000);
      const credentials = {
        userId: 'user-123',
        passwordHash: 'hashed-password',
        failedLoginAttempts: 5,
        lockedUntil: futureDate,
      };

      authCredentialsRepo.findByUserId.mockResolvedValue(credentials as any);

      await expect(service.validatePassword('user-123', 'password')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw error for invalid password', async () => {
      const credentials = {
        userId: 'user-123',
        passwordHash: 'hashed-password',
        failedLoginAttempts: 0,
        lockedUntil: null,
      };

      authCredentialsRepo.findByUserId.mockResolvedValue(credentials as any);
      crypto.comparePassword.mockResolvedValue(false);

      await expect(service.validatePassword('user-123', 'wrongpassword')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('validateStatus', () => {
    it('should not throw for active user', async () => {
      usersRepo.findById.mockResolvedValue(mockUser as any);

      await expect(service.validateStatus('user-123')).resolves.not.toThrow();
    });

    it('should throw error if user is suspended', async () => {
      const suspendedUser = { ...mockUser, status: UserStatus.SUSPENDED };
      usersRepo.findById.mockResolvedValue(suspendedUser as any);

      await expect(service.validateStatus('user-123')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw error if user is deleted', async () => {
      const deletedUser = { ...mockUser, status: UserStatus.DELETED };
      usersRepo.findById.mockResolvedValue(deletedUser as any);

      await expect(service.validateStatus('user-123')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('createEmailVerificationToken', () => {
    it('should create and return email verification token', async () => {
      const tokenRaw = 'raw-token-123';
      const tokenHash = 'hashed-token-123';

      crypto.generateToken.mockReturnValue({ raw: tokenRaw, hash: tokenHash });
      emailVerifyTokenRepo.create.mockResolvedValue(undefined);

      const result = await service.createEmailVerificationToken('user-123', 'test@example.com');

      expect(result).toBe(tokenRaw);
      expect(emailVerifyTokenRepo.create).toHaveBeenCalled();
    });
  });

  describe('verifyEmail', () => {
    it('should verify email with valid token', async () => {
      const tokenRaw = 'raw-token-123';
      const tokenHash = 'hashed-token-123';
      const token = {
        id: 'token-123',
        userId: 'user-123',
        tokenHash,
        usedAt: null,
        expiresAt: new Date(Date.now() + 60000),
      };

      crypto.hashToken.mockReturnValue(tokenHash);
      emailVerifyTokenRepo.findByTokenHash.mockResolvedValue(token as any);
      emailVerifyTokenRepo.markUsed.mockResolvedValue(undefined);
      usersRepo.markEmailVerified.mockResolvedValue(undefined);

      await expect(service.verifyEmail(tokenRaw)).resolves.not.toThrow();
      expect(emailVerifyTokenRepo.markUsed).toHaveBeenCalledWith(token.id);
      expect(usersRepo.markEmailVerified).toHaveBeenCalledWith(token.userId);
    });

    it('should throw error if token not found', async () => {
      crypto.hashToken.mockReturnValue('hashed-token');
      emailVerifyTokenRepo.findByTokenHash.mockResolvedValue(null);

      await expect(service.verifyEmail('invalid-token')).rejects.toThrow(BadRequestException);
    });

    it('should throw error if token already used', async () => {
      const token = {
        id: 'token-123',
        userId: 'user-123',
        tokenHash: 'hashed',
        usedAt: new Date(),
        expiresAt: new Date(Date.now() + 60000),
      };

      crypto.hashToken.mockReturnValue('hashed');
      emailVerifyTokenRepo.findByTokenHash.mockResolvedValue(token as any);

      await expect(service.verifyEmail('token')).rejects.toThrow(BadRequestException);
    });

    it('should throw error if token expired', async () => {
      const token = {
        id: 'token-123',
        userId: 'user-123',
        tokenHash: 'hashed',
        usedAt: null,
        expiresAt: new Date(Date.now() - 60000),
      };

      crypto.hashToken.mockReturnValue('hashed');
      emailVerifyTokenRepo.findByTokenHash.mockResolvedValue(token as any);

      await expect(service.verifyEmail('token')).rejects.toThrow(BadRequestException);
    });
  });

  describe('createPasswordResetToken', () => {
    it('should create and return password reset token', async () => {
      const tokenRaw = 'reset-token-123';
      const tokenHash = 'hashed-reset-token';

      crypto.generateToken.mockReturnValue({ raw: tokenRaw, hash: tokenHash });
      passwordResetTokenRepo.create.mockResolvedValue(undefined);

      const result = await service.createPasswordResetToken('user-123');

      expect(result).toBe(tokenRaw);
      expect(passwordResetTokenRepo.create).toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      const tokenRaw = 'reset-token';
      const tokenHash = 'hashed-reset-token';
      const newPassword = 'newpassword123';
      const passwordHash = 'hashed-new-password';

      const token = {
        id: 'token-123',
        userId: 'user-123',
        tokenHash,
        usedAt: null,
        expiresAt: new Date(Date.now() + 60000),
      };

      crypto.hashToken.mockReturnValue(tokenHash);
      passwordResetTokenRepo.findByTokenHash.mockResolvedValue(token as any);
      crypto.hashPassword.mockResolvedValue(passwordHash);
      passwordResetTokenRepo.markUsed.mockResolvedValue(undefined);
      authCredentialsRepo.updatePassword.mockResolvedValue(undefined);

      await expect(service.resetPassword(tokenRaw, newPassword)).resolves.not.toThrow();
      expect(passwordResetTokenRepo.markUsed).toHaveBeenCalledWith(token.id);
      expect(authCredentialsRepo.updatePassword).toHaveBeenCalledWith(
        token.userId,
        expect.any(Object),
      );
    });

    it('should throw error if token not found', async () => {
      crypto.hashToken.mockReturnValue('hashed');
      passwordResetTokenRepo.findByTokenHash.mockResolvedValue(null);

      await expect(service.resetPassword('invalid-token', 'newpassword')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw error if token expired', async () => {
      const token = {
        id: 'token-123',
        userId: 'user-123',
        tokenHash: 'hashed',
        usedAt: null,
        expiresAt: new Date(Date.now() - 60000),
      };

      crypto.hashToken.mockReturnValue('hashed');
      passwordResetTokenRepo.findByTokenHash.mockResolvedValue(token as any);

      await expect(service.resetPassword('token', 'newpassword')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
