export interface AiMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AiCompletionParams {
  messages: AiMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AiCompletionResult {
  content: string;
  model: string;
  tokensUsed: number;
}
