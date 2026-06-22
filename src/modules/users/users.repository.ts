import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { PrismaTxClient } from '@prisma/prisma.types';

import { CreateUserInput, UpdateStatusInput, UpdateUserInput } from './types';

@Injectable()
export class UsersRepo {
  constructor(private readonly prisma: PrismaService) {}

  async findById(userId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email, deletedAt: null },
    });
  }

  async create(input: CreateUserInput, tx?: PrismaTxClient): Promise<User> {
    const client = tx ?? this.prisma;
    return client.user.create({ data: input });
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        lastLoginAt: new Date(),
        loginCount: { increment: 1 },
      },
    });
  }

  async updateStatus(userId: string, input: UpdateStatusInput): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { status: input.status },
    });
  }

  async markEmailVerified(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });
  }

  async update(userId: string, data: UpdateUserInput): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  async completeOnboarding(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { onboardingCompleted: true },
    });
  }
}
