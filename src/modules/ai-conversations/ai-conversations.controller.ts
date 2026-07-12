import { SkipTransform } from '@common/decorators';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { JwtAccessPayload } from '@modules/tokens';
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
    @CurrentUser() user: JwtAccessPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedPage = page ? parseInt(page, 10) : undefined;
    const parsedLimit = limit ? parseInt(limit, 10) : undefined;

    return this.aiConversationsService.getConversations(
      user.sub,
      Number.isInteger(parsedPage) ? parsedPage : undefined,
      Number.isInteger(parsedLimit) ? parsedLimit : undefined,
    );
  }

  @Get(':conversationId')
  async getConversation(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: JwtAccessPayload,
  ) {
    return this.aiConversationsService.getConversation(conversationId, user.sub);
  }

  // ─── Commands ─────────────────────────────────────────────────────────────

  @Post()
  async createConversation(
    @CurrentUser() user: JwtAccessPayload,
    @Body() dto: CreateConversationDto,
  ) {
    return this.aiConversationsService.createConversation(user.sub, dto.vehicleId, dto.title);
  }

  @Post(':conversationId/messages')
  @Sse()
  @SkipTransform()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async sendMessage(
    @Param('conversationId') conversationId: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: JwtAccessPayload,
  ): Promise<Observable<MessageEvent>> {
    const { message, stream } = await this.aiConversationsService.addMessage(
      conversationId,
      user.sub,
      dto.content,
    );

    return new Observable((subscriber) => {
      let accumulatedContent = '';

      (async () => {
        try {
          for await (const chunk of stream) {
            accumulatedContent += chunk;

            subscriber.next({
              type: 'chunk',
              data: { chunk },
            } as MessageEvent);
          }

          const tokensUsed = Number((await stream.next()).value ?? 0);

          await this.aiConversationsService.saveAssistantMessage(
            conversationId,
            accumulatedContent,
            tokensUsed,
            false,
          );

          subscriber.next({
            type: 'complete',
            data: {
              messageId: `${message.id}:assistant`,
              content: accumulatedContent,
              tokensUsed,
            },
          } as MessageEvent);

          subscriber.complete();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';

          await this.aiConversationsService.saveAssistantMessage(
            conversationId,
            accumulatedContent || `Error: ${errorMessage}`,
            0,
            true,
          );

          subscriber.next({
            type: 'error',
            data: { error: errorMessage },
          } as MessageEvent);

          subscriber.error(error);
        }
      })();
    });
  }
}
