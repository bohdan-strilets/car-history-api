import { AppConfigService } from '@config/config.service';
import { VehicleSpecsPromptParams } from '@modules/vehicles';
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import OpenAI from 'openai';

import type { AiCompletionParams, AiCompletionResult } from './ai.types';
import { buildVehicleSpecsPrompt } from './prompts';

@Injectable()
export class AiService {
  private readonly client: OpenAI;
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly config: AppConfigService) {
    this.client = new OpenAI({
      baseURL: this.config.openRouterBaseUrl,
      apiKey: this.config.openRouterApiKey,
      defaultHeaders: {
        'HTTP-Referer': this.config.frontendUrl,
        'X-Title': this.config.siteName,
      },
    });
  }

  async complete(params: AiCompletionParams): Promise<AiCompletionResult> {
    try {
      const response = await this.client.chat.completions.create({
        model: params.model ?? this.config.openRouterDefaultModel,
        messages: params.messages,
        max_tokens: params.maxTokens ?? this.config.openRouterMaxTokens,
        temperature: params.temperature ?? 0.2,
      });

      return {
        content: response.choices[0]?.message?.content ?? '',
        model: response.model,
        tokensUsed: response.usage?.total_tokens ?? 0,
      };
    } catch (error) {
      this.logger.error('OpenRouter API error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new InternalServerErrorException('AI service unavailable');
    }
  }

  async fillVehicleSpecs(params: VehicleSpecsPromptParams): Promise<Record<string, unknown>> {
    const prompt = buildVehicleSpecsPrompt(params);

    const result = await this.complete({
      messages: [{ role: 'user', content: prompt }],
      maxTokens: this.config.openRouterMaxTokens,
      temperature: 0.1,
    });

    try {
      return JSON.parse(result.content);
    } catch {
      return {};
    }
  }
}
