import { Injectable } from '@nestjs/common';
import { EmailChangeToken } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';

import { CreateEmailChangeTokenInput } from './types';

@Injectable()
export class EmailChangeTokenRepo {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateEmailChangeTokenInput): Promise<void> {
    await this.prisma.emailChangeToken.create({ data: input });
  }

  async findByTokenHash(tokenHash: string): Promise<EmailChangeToken | null> {
    return this.prisma.emailChangeToken.findFirst({
      where: { tokenHash },
    });
  }

  async markUsed(id: string): Promise<void> {
    await this.prisma.emailChangeToken.updateMany({
      where: { id, usedAt: null },
      data: { usedAt: new Date() },
    });
  }
}
