import { CryptoService } from '@common/crypto';
import {
  BadRequestException,
  ConflictException,
  ErrorCodes,
  NotFoundException,
  UnauthorizedException,
} from '@common/exceptions';
import { createExpiresAt, formatEmail } from '@common/utils';
import { AppConfigService } from '@config/config.service';
import { Injectable } from '@nestjs/common';
import { User, UserSettings, UserStatus } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';

import { AuthCredentialsRepo } from './auth-credentials.repository';
import {
  CreateGoogleUserDto,
  CreateUserDto,
  UpdateUserDto,
  UpdateUserSettingsDto,
  UserProfileResponseDto,
  UserResponseDto,
} from './dto';
import { EmailVerifyTokenRepo } from './email-verify-token.repository';
import { toUserProfileResponse, toUserResponse } from './mappers';
import { PasswordResetTokenRepo } from './password-reset-token.repository';
import { UserSettingsRepo } from './user-settings.repository';
import { UsersRepo } from './users.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepo: UsersRepo,
    private readonly emailVerifyTokenRepo: EmailVerifyTokenRepo,
    private readonly passwordResetTokenRepo: PasswordResetTokenRepo,
    private readonly authCredentialsRepo: AuthCredentialsRepo,
    private readonly userSettingsRepo: UserSettingsRepo,
    private readonly crypto: CryptoService,
    private readonly config: AppConfigService,
    private readonly prisma: PrismaService,
  ) {}

  // ─── Queries ──────────────────────────────────────────────────────────────

  async getById(userId: string): Promise<User> {
    const user = await this.usersRepo.findById(userId);
    if (!user) throw new NotFoundException(ErrorCodes.User.NOT_FOUND);

    return user;
  }

  async getByEmail(email: string): Promise<User> {
    const formattedEmail = formatEmail(email);
    const user = await this.usersRepo.findByEmail(formattedEmail);

    if (!user) throw new NotFoundException(ErrorCodes.User.NOT_FOUND);

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const formattedEmail = formatEmail(email);
    return await this.usersRepo.findByEmail(formattedEmail);
  }

  async getProfile(userId: string): Promise<UserProfileResponseDto> {
    const user = await this.getById(userId);
    const settings = await this.userSettingsRepo.findByUserId(userId);

    if (!settings) throw new NotFoundException(ErrorCodes.User.NOT_FOUND);

    return toUserProfileResponse(user, settings);
  }

  async updateMe(userId: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.usersRepo.update(userId, dto);
    return toUserResponse(user);
  }

  async completeOnboarding(userId: string): Promise<void> {
    await this.usersRepo.completeOnboarding(userId);
  }

  // ─── Register ─────────────────────────────────────────────────────────────

  async createUser(dto: CreateUserDto): Promise<User> {
    const formattedEmail = formatEmail(dto.email);

    const existing = await this.usersRepo.findByEmail(formattedEmail);
    if (existing) throw new ConflictException(ErrorCodes.Email.ALREADY_EXISTS);

    const passwordHash = await this.crypto.hashPassword(dto.password);

    return this.prisma.$transaction(async (tx) => {
      const userPayload = {
        email: formattedEmail,
        firstName: dto.firstName,
        lastName: dto.lastName,
      };

      const user = await this.usersRepo.create(userPayload, tx);

      const credentialsPayload = {
        userId: user.id,
        passwordHash,
      };

      await this.authCredentialsRepo.create(credentialsPayload, tx);

      await this.userSettingsRepo.create(user.id, tx);

      return user;
    });
  }

  async createFromGoogle(dto: CreateGoogleUserDto): Promise<User> {
    const formattedEmail = formatEmail(dto.email);

    const existing = await this.usersRepo.findByEmail(formattedEmail);
    if (existing) return existing;

    return this.prisma.$transaction(async (tx) => {
      const userPayload = {
        email: formattedEmail,
        firstName: dto.firstName,
        lastName: dto.lastName,
        avatarUrl: dto.avatarUrl,
        emailVerified: true,
      };

      const user = await this.usersRepo.create(userPayload, tx);

      const credentialsPayload = { userId: user.id };
      await this.authCredentialsRepo.create(credentialsPayload, tx);

      await this.userSettingsRepo.create(user.id, tx);

      return user;
    });
  }

  // ─── Login ────────────────────────────────────────────────────────────────

  async validatePassword(userId: string, password: string): Promise<void> {
    const credentials = await this.authCredentialsRepo.findByUserId(userId);

    if (!credentials?.passwordHash) {
      throw new UnauthorizedException(ErrorCodes.Auth.INVALID_CREDENTIALS);
    }

    if (credentials.lockedUntil && credentials.lockedUntil > new Date()) {
      throw new UnauthorizedException(ErrorCodes.Auth.ACCOUNT_LOCKED);
    }

    const isValid = await this.crypto.comparePassword(password, credentials.passwordHash);

    if (!isValid) {
      await this.handleFailedAttempt(userId, credentials.failedLoginAttempts);
      throw new UnauthorizedException(ErrorCodes.Auth.INVALID_CREDENTIALS);
    }

    await this.authCredentialsRepo.resetFailedAttempts(userId);
    await this.usersRepo.updateLastLogin(userId);
  }

  async validateStatus(userId: string): Promise<void> {
    const user = await this.getById(userId);

    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException(ErrorCodes.Auth.ACCOUNT_SUSPENDED);
    }

    if (user.status === UserStatus.DELETED) {
      throw new UnauthorizedException(ErrorCodes.Auth.ACCOUNT_DELETED);
    }
  }

  // ─── Email Verification ───────────────────────────────────────────────────

  async createEmailVerificationToken(userId: string, email: string): Promise<string> {
    const { raw, hash } = this.crypto.generateToken();
    const formattedEmail = formatEmail(email);
    const expiresAt = createExpiresAt(24 * 60);

    await this.emailVerifyTokenRepo.create({
      userId,
      email: formattedEmail,
      tokenHash: hash,
      expiresAt,
    });

    return raw;
  }

  async verifyEmail(tokenRaw: string): Promise<void> {
    const tokenHash = this.crypto.hashToken(tokenRaw);
    const token = await this.emailVerifyTokenRepo.findByTokenHash(tokenHash);

    if (!token) {
      throw new BadRequestException(ErrorCodes.Token.INVALID);
    }
    if (token.usedAt) {
      throw new BadRequestException(ErrorCodes.Token.ALREADY_USED);
    }
    if (token.expiresAt < new Date()) {
      throw new BadRequestException(ErrorCodes.Token.EXPIRED);
    }

    await this.emailVerifyTokenRepo.markUsed(token.id);
    await this.usersRepo.markEmailVerified(token.userId);
  }

  // ─── Password Reset ───────────────────────────────────────────────────────

  async createPasswordResetToken(userId: string): Promise<string> {
    const { raw, hash } = this.crypto.generateToken();
    const expiresAt = createExpiresAt(60);

    await this.passwordResetTokenRepo.create({
      userId,
      tokenHash: hash,
      expiresAt,
    });

    return raw;
  }

  async resetPassword(tokenRaw: string, newPassword: string): Promise<void> {
    const tokenHash = this.crypto.hashToken(tokenRaw);
    const token = await this.passwordResetTokenRepo.findByTokenHash(tokenHash);

    if (!token) {
      throw new BadRequestException(ErrorCodes.Token.INVALID);
    }
    if (token.expiresAt < new Date()) {
      throw new BadRequestException(ErrorCodes.Token.EXPIRED);
    }

    const passwordHash = await this.crypto.hashPassword(newPassword);

    await this.passwordResetTokenRepo.markUsed(token.id);
    await this.authCredentialsRepo.updatePassword(token.userId, {
      passwordHash,
      passwordChangedAt: new Date(),
    });
  }

  // ─── Settings ─────────────────────────────────────────────────────────────

  async updateSettings(userId: string, dto: UpdateUserSettingsDto): Promise<UserSettings> {
    return this.userSettingsRepo.update(userId, dto);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async handleFailedAttempt(userId: string, currentAttempts: number): Promise<void> {
    const isLastAttempt = currentAttempts + 1 >= this.config.maxFailedAttempts;
    const lockedUntil = isLastAttempt
      ? createExpiresAt(this.config.lockDurationMinutes)
      : undefined;

    await this.authCredentialsRepo.incrementFailedAttempts(userId, { lockedUntil });
  }
}
