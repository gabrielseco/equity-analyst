import Anthropic from "@anthropic-ai/sdk";
import type { FactCheckResult } from "../models/types";

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

  constructor(apiKey: string, model: "haiku" | "sonnet" | "opus" = "sonnet") {
    this.client = new Anthropic({ apiKey });
    this.model = this.getModelId(model);
  }

  private getModelId(model: "haiku" | "sonnet" | "opus"): string {
    const models = {
      haiku: "claude-haiku-4-5-20251001",
      sonnet: "claude-sonnet-4-5-20250929",
      opus: "claude-opus-4-5-20251101",
    };
    return models[model];
  }

  /**
   * Generate equity research analysis using Claude with optional fact-checking
   */
  async generateAnalysis(prompt: string, enableFactCheck: boolean = false): Promise<AnalysisResult> {
    try {
      // Build the base request parameters
      const requestParams: Anthropic.MessageCreateParams = {
        model: this.model,
        max_tokens: 8000,
        temperature: 0.7,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      };

      // Add web search tool if fact-checking is enabled
      if (enableFactCheck) {
        requestParams.tools = [
          {
            type: "web_search_20250305",
            name: "web_search",
            max_uses: 15, // Moderate fact-checking: up to 15 searches
          } as any, // TypeScript might not have latest types yet
        ];
      }

      const response = await this.client.messages.create(requestParams);

      // Extract text content from response
      let text = "";
      for (const block of response.content) {
        if (block.type === "text") {
          text += block.text;
        }
      }

      if (!text) {
        throw new Error("No text content in response");
      }

      return {
        text,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
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
