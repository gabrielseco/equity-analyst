import type { AnalysisInput, AnalysisReport } from '../models/types';
import { FinancialDataService } from './financial-data';
import { AnthropicService } from './anthropic';
import { buildAnalystPrompt } from '../prompts/analyst-prompt';
import { MarkdownExporter } from '../utils/markdown-export';
import { getApiKeys, getDefaultModel } from '../config/settings';
import ora from 'ora';

export interface GenerateReportOptions {
  input: AnalysisInput;
  model?: 'haiku' | 'sonnet' | 'opus';
  interactive?: boolean;
  enableFactCheck?: boolean;
}

export class ReportGenerator {
  /**
   * Estimate API cost based on token usage and model
   * Prices as of December 2024 (per million tokens)
   */
  private static estimateCost(
    inputTokens: number,
    outputTokens: number,
    model: 'haiku' | 'sonnet' | 'opus',
    searchCount: number = 0
  ): number {
    // Pricing per million tokens (MTok)
    const pricing = {
      haiku: { input: 1.00, output: 5.00 },
      sonnet: { input: 3.00, output: 15.00 },
      opus: { input: 15.00, output: 75.00 },
    };

    const modelPricing = pricing[model];
    const inputCost = (inputTokens / 1_000_000) * modelPricing.input;
    const outputCost = (outputTokens / 1_000_000) * modelPricing.output;

    // Web search cost: $10 per 1,000 searches
    const searchCost = (searchCount / 1_000) * 10;

    return inputCost + outputCost + searchCost;
  }

  /**
   * Generate complete equity research report
   */
  static async generate(options: GenerateReportOptions): Promise<string> {
    const { input, model, interactive = false, enableFactCheck = false } = options;

    try {
      // Get API keys
      const apiKeys = await getApiKeys();
      const selectedModel = model || (await getDefaultModel());

      console.log('🔍 Fetching financial data...\n');

      // Fetch financial data
      const financialService = new FinancialDataService(apiKeys.alphaVantage);
      const financialData = await financialService.fetchFinancialData(input.ticker, interactive);

      console.log('✓ Financial data fetched successfully\n');

      // Build analysis prompt
      const prompt = buildAnalystPrompt(input, financialData, enableFactCheck);

      // Generate analysis with Claude
      const spinnerText = enableFactCheck
        ? `Calling Claude API (${selectedModel}) with fact-checking enabled...`
        : `Calling Claude API (${selectedModel})...`;

      const spinner = ora({
        text: spinnerText,
        color: 'cyan',
      }).start();

      const anthropicService = new AnthropicService(apiKeys.anthropic, selectedModel);
      const result = await anthropicService.generateAnalysis(prompt, enableFactCheck);

      // Calculate approximate cost
      const searchCount = result.searchCount || 0;
      const cost = ReportGenerator.estimateCost(
        result.usage.inputTokens,
        result.usage.outputTokens,
        selectedModel,
        searchCount
      );

      const costBreakdown = enableFactCheck && searchCount > 0
        ? ` | Est. cost: $${cost.toFixed(4)} (including ${searchCount} web searches)`
        : ` | Est. cost: $${cost.toFixed(4)}`;

      spinner.succeed(
        `Analysis generated | Tokens: ${result.usage.inputTokens.toLocaleString()} in / ${result.usage.outputTokens.toLocaleString()} out (${result.usage.totalTokens.toLocaleString()} total)${costBreakdown}`
      );
      console.log();

      // Create report object
      const report: AnalysisReport = {
        ticker: input.ticker.toUpperCase(),
        companyName: financialData.overview.name,
        investmentThesis: input.investmentThesis,
        goal: input.goal,
        analysis: result.text,
        generatedAt: new Date().toISOString(),
        financialData,
      };

      // Save to markdown
      console.log('💾 Saving report...\n');
      const savePath = input.saveTo || './reports';
      const filePath = await MarkdownExporter.saveReport(report, savePath);

      console.log(`✅ Report saved successfully!`);
      console.log(`📄 Location: ${filePath}\n`);

      return filePath;
    } catch (error) {
      throw new Error(
        `Failed to generate report: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
