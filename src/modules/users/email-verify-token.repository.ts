import { Injectable } from '@nestjs/common';
import { EmailVerificationToken } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';

import { CreateEmailVerifyTokenInput } from './types';

@Injectable()
export class EmailVerifyTokenRepo {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateEmailVerifyTokenInput): Promise<void> {
    await this.prisma.emailVerificationToken.create({ data: input });
  }

  async findByTokenHash(tokenHash: string): Promise<EmailVerificationToken | null> {
    return this.prisma.emailVerificationToken.findFirst({
      where: { tokenHash },
    });
  }

  async markUsed(id: string): Promise<void> {
    await this.prisma.emailVerificationToken.updateMany({
      where: { id, usedAt: null },
      data: { usedAt: new Date() },
    });
  }
}
