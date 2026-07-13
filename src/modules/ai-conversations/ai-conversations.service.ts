import { ErrorCodes } from '@common/exceptions';
import { ForbiddenException, NotFoundException } from '@common/exceptions/http.exceptions';
import { AiService } from '@modules/ai/ai.service';
import { MaintenanceService } from '@modules/maintenance/maintenance.service';
import { TimelineService } from '@modules/timeline/timeline.service';
import { VehiclesService } from '@modules/vehicles/vehicles.service';
import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { AiConversationsRepository } from './ai-conversations.repository';
import { buildConversationSystemPrompt } from './prompts';
import {
  ConversationSystemPromptParams,
  CreateConversationInput,
  MappedAiConversation,
  MappedAiConversationDetail,
  MappedAiMessage,
} from './types';

@Injectable()
export class AiConversationsService {
  private readonly logger = new Logger(AiConversationsService.name);

  constructor(
    private readonly repository: AiConversationsRepository,
    private readonly aiService: AiService,
    private readonly vehiclesService: VehiclesService,
    private readonly timelineService: TimelineService,
    private readonly maintenanceService: MaintenanceService,
  ) {}

  // ─── Queries ──────────────────────────────────────────────────────────────

  async getConversations(
    userId: string,
    page?: number,
    limit?: number,
  ): Promise<ReturnType<typeof this.repository.findManyByUser>> {
    return this.repository.findManyByUser(userId, page, limit);
  }

  async getConversation(
    conversationId: string,
    userId: string,
  ): Promise<MappedAiConversationDetail> {
    await this.assertOwnership(conversationId, userId);
    const conversation = await this.repository.findByIdWithMessages(conversationId);

    if (!conversation) {
      throw new NotFoundException(ErrorCodes.Ai.CONVERSATION_NOT_FOUND);
    }

    return conversation;
  }

  // ─── Commands ──────────────────────────────────────────────────────────────

  async createConversation(
    userId: string,
    vehicleId?: string,
    title?: string,
  ): Promise<MappedAiConversation> {
    let finalTitle = title;

    if (!finalTitle && vehicleId) {
      const vehicle = await this.vehiclesService.getById(vehicleId);
      finalTitle = `${vehicle.brand} ${vehicle.model} (${vehicle.year})`;
    }

    finalTitle = finalTitle || 'New conversation';

    const data: CreateConversationInput = {
      userId,
      vehicleId: vehicleId || null,
      title: finalTitle,
    };

    return this.repository.create(data);
  }

  async addMessage(
    conversationId: string,
    userId: string,
    userContent: string,
  ): Promise<{ message: MappedAiMessage; stream: AsyncGenerator<string, number> }> {
    const conversation = await this.repository.findRawConversation(conversationId);

    if (!conversation) {
      throw new NotFoundException(ErrorCodes.Ai.CONVERSATION_NOT_FOUND);
    }

    if (conversation.userId !== userId) {
      throw new ForbiddenException(ErrorCodes.Ai.CONVERSATION_ACCESS_DENIED);
    }

    // Save user message
    const userMessage = await this.repository.createMessage({
      conversationId,
      role: 'USER',
      content: userContent,
    });

    // Build system prompt with context
    const systemPrompt = await this.buildContextualSystemPrompt(conversation.vehicleId);

    // Get message history (last 50)
    const history = await this.repository.findByIdWithMessages(conversationId, 50);
    const messages = history?.messages ?? [];

    // Prepare messages for API: system + history + new user message
    // Language instruction is embedded directly into the user turn content (not as a
    // separate system message) because weaker models attend far more reliably to
    // instructions inside the immediate user message than to system messages placed
    // mid-conversation, which tend to get ignored after a few turns.
    const languageTaggedContent = `[Respond in the same language as this message] ${userContent}`;

    const apiMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: languageTaggedContent },
    ];

    // Return user message + stream generator
    const stream = this.aiService.streamComplete({
      messages: apiMessages,
      temperature: 0.7,
    });

    return { message: userMessage, stream };
  }

  async saveAssistantMessage(
    conversationId: string,
    content: string,
    tokensUsed: number,
    isError: boolean = false,
    tx?: Prisma.TransactionClient,
  ): Promise<MappedAiMessage> {
    return this.repository.createMessage(
      {
        conversationId,
        role: 'ASSISTANT',
        content,
        tokensUsed,
        isError,
      },
      tx,
    );
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async buildContextualSystemPrompt(vehicleId?: string | null): Promise<string> {
    if (!vehicleId) {
      return buildConversationSystemPrompt({});
    }

    try {
      const vehicle = await this.vehiclesService.getById(vehicleId);
      const maintenance = await this.maintenanceService.getAllByVehicleId(vehicleId);

      // Get timeline events from last 12 months, limit to 30 most recent
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      const timeline = await this.timelineService.getTimeline(vehicleId, {
        dateFrom: twelveMonthsAgo.toISOString().split('T')[0],
        limit: 30,
      });

      const params: ConversationSystemPromptParams = {
        vehicle: {
          brand: vehicle.brand,
          model: vehicle.model,
          year: vehicle.year,
          fuelType: vehicle.fuelType.join(', '),
          plateNumber: vehicle.plateNumber,
          currentMileage: vehicle.currentMileage,
        },
        timelineEvents: (timeline.data ?? []).map((e) => ({
          type: e.type,
          title: e.title,
          eventDate: new Date(e.eventDate),
          mileage: e.mileage,
          cost: e.cost ? parseFloat(e.cost) : null,
        })),
        maintenanceIntervals: (maintenance ?? []).map((m) => ({
          type: m.type,
          title: m.title,
          nextServiceMileage: m.nextServiceMileage,
          nextServiceDate: m.nextServiceDate ? new Date(m.nextServiceDate) : null,
        })),
      };

      return buildConversationSystemPrompt(params);
    } catch (error) {
      this.logger.error('Failed to build contextual system prompt', {
        vehicleId,
        error: error instanceof Error ? error.message : String(error),
      });

      return buildConversationSystemPrompt({});
    }
  }

  private async assertOwnership(conversationId: string, userId: string): Promise<void> {
    const conversation = await this.repository.findRawConversation(conversationId);

    if (!conversation) {
      throw new NotFoundException(ErrorCodes.Ai.CONVERSATION_NOT_FOUND);
    }

    if (conversation.userId !== userId) {
      throw new ForbiddenException(ErrorCodes.Ai.CONVERSATION_ACCESS_DENIED);
    }
  }
}
