import { AiConversation, AiMessage } from '@prisma/client';

import { AiConversationWithMessages } from '../types';

// ─── Message mapper ────────────────────────────────────────────────────────────

export const mapAiMessage = (message: AiMessage) => {
  return {
    id: message.id,
    conversationId: message.conversationId,
    role: message.role,
    content: message.content,
    tokensUsed: message.tokensUsed,
    isError: message.isError,
    createdAt: message.createdAt,
  };
};

// ─── Conversation mappers ──────────────────────────────────────────────────────

export const mapAiConversation = (conversation: AiConversation) => {
  return {
    id: conversation.id,
    vehicleId: conversation.vehicleId,
    title: conversation.title,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };
};

export const mapAiConversationDetail = (conversation: AiConversationWithMessages) => {
  return {
    ...mapAiConversation(conversation),
    messages: conversation.messages.map(mapAiMessage),
  };
};
