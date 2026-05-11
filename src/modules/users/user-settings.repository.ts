import { Injectable } from '@nestjs/common';
import { UserSettings } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { PrismaTxClient } from '@prisma/prisma.types';

@Injectable()
export class UserSettingsRepo {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, tx: PrismaTxClient): Promise<UserSettings> {
    const client = tx ?? this.prisma;
    return client.userSettings.create({ data: { userId } });
  }

  async findByUserId(userId: string, tx?: PrismaTxClient): Promise<UserSettings | null> {
    const client = tx ?? this.prisma;
    return client.userSettings.findUnique({ where: { userId } });
  }
}
