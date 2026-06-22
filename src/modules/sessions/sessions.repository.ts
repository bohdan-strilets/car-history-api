import { Injectable } from '@nestjs/common';
import { Session, SessionStatus } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';

import { CreateSessionInput, UpdateSessionInput } from './session.type';

@Injectable()
export class SessionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateSessionInput): Promise<Session> {
    return this.prisma.session.create({ data: input });
  }

  async findById(id: string): Promise<Session | null> {
    return this.prisma.session.findUnique({
      where: { id, status: SessionStatus.ACTIVE },
    });
  }

  async findByTokenFamily(tokenFamily: string): Promise<Session | null> {
    return this.prisma.session.findFirst({
      where: { tokenFamily },
    });
  }

  async update(id: string, input: UpdateSessionInput): Promise<void> {
    await this.prisma.session.update({
      where: { id },
      data: input,
    });
  }

  async revoke(id: string): Promise<void> {
    await this.prisma.session.update({
      where: { id },
      data: {
        status: SessionStatus.REVOKED,
        revokedAt: new Date(),
      },
    });
  }

  async revokeAllByUserId(userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, status: SessionStatus.ACTIVE },
      data: {
        status: SessionStatus.REVOKED,
        revokedAt: new Date(),
      },
    });
  }

  async revokeByTokenFamily(tokenFamily: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { tokenFamily },
      data: {
        status: SessionStatus.REVOKED,
        revokedAt: new Date(),
      },
    });
  }
}
