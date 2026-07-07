import { CurrentUser } from '@common/decorators/current-user.decorator';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import {
  Body,
  Controller,
  Get,
  MessageEvent,
  Param,
  Post,
  Query,
  Sse,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { User } from '@prisma/client';
import { Observable } from 'rxjs';

import { AiConversationsService } from './ai-conversations.service';
import { CreateConversationDto, SendMessageDto } from './dto';

@Controller('ai/conversations')
@UseGuards(JwtAuthGuard)
export class AiConversationsController {
  constructor(private readonly aiConversationsService: AiConversationsService) {}

  // ─── Queries ──────────────────────────────────────────────────────────────

  @Get()
  async getConversations(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedPage = page ? parseInt(page, 10) : undefined;
    const parsedLimit = limit ? parseInt(limit, 10) : undefined;

    return this.aiConversationsService.getConversations(
      user.id,
      Number.isInteger(parsedPage) ? parsedPage : undefined,
      Number.isInteger(parsedLimit) ? parsedLimit : undefined,
    );
  }

  @Get(':conversationId')
  async getConversation(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: User,
  ) {
    return this.aiConversationsService.getConversation(conversationId, user.id);
  }

  // ─── Commands ─────────────────────────────────────────────────────────────

  @Post()
  async createConversation(@CurrentUser() user: User, @Body() dto: CreateConversationDto) {
    return this.aiConversationsService.createConversation(user.id, dto.vehicleId, dto.title);
  }

  @Post(':conversationId/messages')
  @Sse()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async sendMessage(
    @Param('conversationId') conversationId: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: User,
  ): Promise<Observable<MessageEvent>> {
    const { message, stream } = await this.aiConversationsService.addMessage(
      conversationId,
      user.id,
      dto.content,
    );

    return new Observable((subscriber) => {
      let accumulatedContent = '';

      (async () => {
        try {
          // Stream chunks from AI service
          for await (const chunk of stream) {
            accumulatedContent += chunk;

            subscriber.next({
              event: 'chunk',
              data: { chunk },
            } as MessageEvent);
          }

          // Get final token count from generator return value
          const tokensUsed = Number((await stream.next()).value ?? 0);

          // Save complete assistant message to DB
          await this.aiConversationsService.saveAssistantMessage(
            conversationId,
            accumulatedContent,
            tokensUsed,
            false,
          );

          // Send completion event
          subscriber.next({
            event: 'complete',
            data: {
              messageId: `${message.id}:assistant`,
              content: accumulatedContent,
              tokensUsed,
            },
          } as MessageEvent);

          subscriber.complete();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';

          // Save error message to DB
          await this.aiConversationsService.saveAssistantMessage(
            conversationId,
            accumulatedContent || `Error: ${errorMessage}`,
            0,
            true,
          );

          // Send error event
          subscriber.next({
            event: 'error',
            data: { error: errorMessage },
          } as MessageEvent);

          subscriber.error(error);
        }
      })();
    });
  }
}
