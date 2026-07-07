import { PAGINATION_DEFAULTS } from '@common/constants';
import { PaginatedData } from '@common/types';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';

import { mapAiConversation, mapAiConversationDetail, mapAiMessage } from './mappers';
import {
  CreateConversationInput,
  CreateMessageInput,
  MappedAiConversation,
  MappedAiConversationDetail,
  MappedAiMessage,
} from './types';

@Injectable()
export class AiConversationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findManyByUser(
    userId: string,
    page?: number,
    limit?: number,
  ): Promise<PaginatedData<MappedAiConversation>> {
    const p = page ?? PAGINATION_DEFAULTS.DEFAULT_PAGE;
    const l = Math.min(limit ?? PAGINATION_DEFAULTS.DEFAULT_LIMIT, PAGINATION_DEFAULTS.MAX_LIMIT);
    const skip = (p - 1) * l;

    const [conversations, total] = await this.prisma.$transaction([
      this.prisma.aiConversation.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: l,
      }),
      this.prisma.aiConversation.count({ where: { userId } }),
    ]);

    return {
      data: conversations.map(mapAiConversation),
      meta: {
        total,
        page: p,
        limit: l,
        totalPages: Math.ceil(total / l),
      },
    };
  }

  async findById(conversationId: string): Promise<MappedAiConversation | null> {
    const conversation = await this.prisma.aiConversation.findUnique({
      where: { id: conversationId },
    });

    return conversation ? mapAiConversation(conversation) : null;
  }

  async findByIdWithMessages(
    conversationId: string,
    messageLimit?: number,
  ): Promise<MappedAiConversationDetail | null> {
    const limit = messageLimit ?? 50;

    const conversation = await this.prisma.aiConversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: limit,
          skip: 0,
        },
      },
    });

    return conversation ? mapAiConversationDetail(conversation) : null;
  }

  async create(data: CreateConversationInput): Promise<MappedAiConversation> {
    const conversation = await this.prisma.aiConversation.create({
      data,
    });

    return mapAiConversation(conversation);
  }

  async createMessage(
    data: CreateMessageInput,
    tx?: Prisma.TransactionClient,
  ): Promise<MappedAiMessage> {
    const client = tx ?? this.prisma;

    const message = await client.aiMessage.create({
      data,
    });

    return mapAiMessage(message);
  }

  async findRawConversation(conversationId: string) {
    return this.prisma.aiConversation.findUnique({
      where: { id: conversationId },
    });
  }
}
