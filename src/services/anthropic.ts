import Anthropic from "@anthropic-ai/sdk";

export interface AnalysisResult {
  text: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
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
   * Generate equity research analysis using Claude
   */
  async generateAnalysis(prompt: string): Promise<AnalysisResult> {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 8000,
        temperature: 0.7,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const content = response.content[0];
      if (content?.type === "text") {
        return {
          text: content?.text || "",
          usage: {
            inputTokens: response.usage.input_tokens,
            outputTokens: response.usage.output_tokens,
            totalTokens: response.usage.input_tokens + response.usage.output_tokens,
          },
        };
      }

      throw new Error("Unexpected response format from Claude");
    } catch (error) {
      throw new Error(
        `Failed to generate analysis: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}
