import Anthropic from '@anthropic-ai/sdk';
import type { FactCheckResult } from '../models/types';

export interface AnalysisResult {
  text: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  factChecks?: FactCheckResult[];
  searchCount?: number;
}

export class AnthropicService {
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model: 'haiku' | 'sonnet' | 'opus' = 'sonnet') {
    this.client = new Anthropic({ apiKey });
    this.model = this.getModelId(model);
  }

  private getModelId(model: 'haiku' | 'sonnet' | 'opus'): string {
    const models = {
      haiku: 'claude-haiku-4-5-20251001',
      sonnet: 'claude-sonnet-4-5-20250929',
      opus: 'claude-opus-4-5-20251101',
    };
    return models[model];
  }

  /**
   * Generate equity research analysis using Claude with optional fact-checking
   * Now supports prompt caching to reduce costs by ~90% on repeated analyses
   */
  async generateAnalysis(
    prompt: string,
    enableFactCheck: boolean = false,
    systemPrompt?: string
  ): Promise<AnalysisResult> {
    try {
      // Build the base request parameters with prompt caching
      const requestParams: Anthropic.MessageCreateParams = {
        model: this.model,
        max_tokens: 8000,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      };

      // Add system prompt with caching if provided
      // This caches the financial data and instructions for 5 minutes
      if (systemPrompt) {
        requestParams.system = [
          {
            type: 'text',
            text: systemPrompt,
            cache_control: { type: 'ephemeral' },
          } as any,
        ];
      }

      // Add web search tool if fact-checking is enabled
      if (enableFactCheck) {
        requestParams.tools = [
          {
            type: 'web_search_20250305',
            name: 'web_search',
            max_uses: 25, // Allow up to 25 searches (will be limited by prompt instructions)
          } as any, // TypeScript might not have latest types yet
        ];
      }

      const response = await this.client.messages.create(requestParams);

      // Extract text content from response
      let text = '';
      for (const block of response.content) {
        if (block.type === 'text') {
          text += block.text;
        }
      }

      if (!text) {
        throw new Error('No text content in response');
      }

      return {
        text,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          totalTokens:
            response.usage.input_tokens + response.usage.output_tokens,
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to generate analysis: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}
