import type { AnalysisInput, AnalysisReport } from '../models/types';
import { FinancialDataService } from './financial-data';
import { AnthropicService } from './anthropic';
import { buildAnalystPrompt } from '../prompts/analyst-prompt';
import { MarkdownExporter } from '../utils/markdown-export';
import { PdfExporter } from '../utils/pdf-export';
import {
  getApiKeys,
  getDefaultModel,
  getAlphaVantageApiDelay,
} from '../config/settings';
import ora from 'ora';

export interface GenerateReportOptions {
  input: AnalysisInput;
  model?: 'haiku' | 'sonnet' | 'opus';
  interactive?: boolean;
  enableFactCheck?: boolean;
  pdf?: boolean;
  pdfOnly?: boolean;
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
      haiku: { input: 1.0, output: 5.0 },
      sonnet: { input: 3.0, output: 15.0 },
      opus: { input: 15.0, output: 75.0 },
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
    const {
      input,
      model,
      interactive = false,
      enableFactCheck = false,
      pdf = false,
      pdfOnly = false,
    } = options;

    try {
      // Get API keys and configuration
      const apiKeys = await getApiKeys();
      const selectedModel = model || (await getDefaultModel());
      const apiDelay = await getAlphaVantageApiDelay();

      console.log('🔍 Fetching financial data...\n');

      // Fetch financial data with rate limiting
      const financialService = new FinancialDataService(
        apiKeys.alphaVantage,
        apiDelay
      );
      const financialData = await financialService.fetchFinancialData(
        input.ticker,
        interactive
      );

      console.log('✓ Financial data fetched successfully\n');

      // Show fact-checking notification if enabled
      if (enableFactCheck) {
        console.log(
          '🔍 Fact-checking enabled - Claude will verify claims using web search'
        );
        console.log(
          '   (This may add 15-30 seconds and ~$0.10-0.15 to the cost)\n'
        );
      }

      // Build analysis prompt (now returns separate system and user prompts)
      const { systemPrompt, userPrompt } = buildAnalystPrompt(
        input,
        financialData,
        enableFactCheck
      );

      // Generate analysis with Claude
      const spinnerText = enableFactCheck
        ? `Generating analysis with fact-checking (${selectedModel})...`
        : `Generating analysis (${selectedModel})...`;

      const spinner = ora({
        text: spinnerText,
        color: 'cyan',
      }).start();

      const anthropicService = new AnthropicService(
        apiKeys.anthropic,
        selectedModel
      );
      const result = await anthropicService.generateAnalysis(
        userPrompt,
        enableFactCheck,
        systemPrompt // Pass system prompt for caching
      );

      // Calculate approximate cost
      const searchCount = result.searchCount || 0;
      const cost = ReportGenerator.estimateCost(
        result.usage.inputTokens,
        result.usage.outputTokens,
        selectedModel,
        searchCount
      );

      spinner.succeed('Analysis generated');

      // Show detailed statistics
      console.log(
        `   Tokens: ${result.usage.inputTokens.toLocaleString()} in / ${result.usage.outputTokens.toLocaleString()} out (${result.usage.totalTokens.toLocaleString()} total)`
      );

      if (enableFactCheck && searchCount > 0) {
        const tokenCost = cost - (searchCount / 1_000) * 10;
        const searchCost = (searchCount / 1_000) * 10;
        console.log(`   Web searches: ${searchCount} performed`);
        console.log(
          `   Cost breakdown: $${tokenCost.toFixed(
            4
          )} (tokens) + $${searchCost.toFixed(4)} (searches) = $${cost.toFixed(
            4
          )} total`
        );
      } else {
        console.log(`   Estimated cost: $${cost.toFixed(4)}`);
      }
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
        factCheckEnabled: enableFactCheck,
        searchCount: enableFactCheck ? searchCount : undefined,
      };

      // Save reports
      console.log('💾 Saving report...\n');
      const savePath = input.saveTo || './reports';
      let filePath: string;

      if (pdfOnly) {
        // Only generate PDF
        filePath = await PdfExporter.savePDF(report, savePath);
        console.log(`✅ PDF report saved successfully!`);
        console.log(`📄 Location: ${filePath}`);
      } else {
        // Always save markdown
        filePath = await MarkdownExporter.saveReport(report, savePath);
        console.log(`✅ Markdown report saved successfully!`);
        console.log(`📄 Location: ${filePath}`);

        // Also save PDF if requested
        if (pdf) {
          console.log('\n📄 Generating PDF version...');
          const pdfFilePath = await PdfExporter.savePDF(report, savePath);
          console.log(`✅ PDF report saved successfully!`);
          console.log(`📄 Location: ${pdfFilePath}`);
        }
      }

      // Show summary
      console.log('\n📊 Report Summary:');
      console.log(
        `   Company: ${
          financialData.overview.name
        } (${input.ticker.toUpperCase()})`
      );
      console.log(`   Model: ${selectedModel}`);
      console.log(
        `   Fact-checking: ${enableFactCheck ? '✓ Enabled' : '✗ Disabled'}`
      );
      if (enableFactCheck && searchCount > 0) {
        console.log(`   Web searches: ${searchCount} performed`);
      }
      console.log(`   Total cost: $${cost.toFixed(4)}\n`);

      return filePath;
    } catch (error) {
      throw new Error(
        `Failed to generate report: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}
