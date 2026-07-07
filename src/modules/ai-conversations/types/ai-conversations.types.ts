import { AiConversation, AiMessage, MessageRole } from '@prisma/client';

import { mapAiConversation, mapAiConversationDetail, mapAiMessage } from '../mappers';

// Shared types

export type AiConversationWithMessages = AiConversation & {
  messages: AiMessage[];
};

export type MappedAiConversation = ReturnType<typeof mapAiConversation>;
export type MappedAiConversationDetail = ReturnType<typeof mapAiConversationDetail>;
export type MappedAiMessage = ReturnType<typeof mapAiMessage>;

// Repository types

export type CreateConversationInput = {
  userId: string;
  vehicleId?: string | null;
  title: string;
};

export type CreateMessageInput = {
  conversationId: string;
  role: MessageRole;
  content: string;
  tokensUsed?: number | null;
  isError?: boolean;
};

// System prompt context

export interface ConversationVehicleContext {
  brand: string;
  model: string;
  year: number;
  fuelType: string;
  plateNumber: string;
  currentMileage: number;
}

export interface ConversationTimelineEventContext {
  type: string;
  title: string;
  eventDate: Date;
  mileage: number;
  cost: number | null;
}

export interface ConversationMaintenanceContext {
  type: string;
  title: string;
  nextServiceMileage: number | null;
  nextServiceDate: Date | null;
}

export interface ConversationSystemPromptParams {
  vehicle?: ConversationVehicleContext;
  timelineEvents?: ConversationTimelineEventContext[];
  maintenanceIntervals?: ConversationMaintenanceContext[];
}
