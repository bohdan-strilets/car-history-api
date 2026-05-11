import { Injectable } from '@nestjs/common';
import { AuthCredentials } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { PrismaTxClient } from '@prisma/prisma.types';

import { CreateCredentialsInput, IncrementFailedAttemptsInput, UpdatePasswordInput } from './types';

@Injectable()
export class AuthCredentialsRepo {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<AuthCredentials | null> {
    return this.prisma.authCredentials.findUnique({
      where: { userId },
    });
  }

  async create(input: CreateCredentialsInput, tx: PrismaTxClient): Promise<void> {
    const client = tx ?? this.prisma;
    await client.authCredentials.create({ data: input });
  }

  async updatePassword(
    userId: string,
    input: UpdatePasswordInput,
    tx?: PrismaTxClient,
  ): Promise<void> {
    const client = tx ?? this.prisma;

    await client.authCredentials.update({
      where: { userId },
      data: {
        passwordHash: input.passwordHash,
        passwordChangedAt: input.passwordChangedAt,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
  }

  async incrementFailedAttempts(
    userId: string,
    input: IncrementFailedAttemptsInput,
  ): Promise<void> {
    await this.prisma.authCredentials.update({
      where: { userId },
      data: {
        failedLoginAttempts: { increment: 1 },
        lastFailedLoginAt: new Date(),
        ...(input.lockedUntil && { lockedUntil: input.lockedUntil }),
      },
    });
  }

  async resetFailedAttempts(userId: string): Promise<void> {
    await this.prisma.authCredentials.update({
      where: { userId },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastFailedLoginAt: null,
      },
    });
  }
}
