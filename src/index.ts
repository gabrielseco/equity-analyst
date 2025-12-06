#!/usr/bin/env bun
import { Command } from 'commander';
import { runInteractive } from './utils/interactive';
import { ReportGenerator } from './services/report-generator';
import type { AnalysisInput } from './models/types';

const program = new Command();

program
  .name('equity-analyst')
  .description(
    'AI-powered equity research analyst using Claude and financial data APIs'
  )
  .version('1.0.0');

/**
 * Main analyze command handler
 */
async function handleAnalyze(
  ticker: string | undefined,
  options: {
    thesis?: string;
    goal?: string;
    saveTo?: string;
    model?: 'haiku' | 'sonnet' | 'opus';
    factCheck?: boolean;
  }
) {
  try {
    let input: AnalysisInput;
    let isInteractive = false;

    // If no ticker provided, run interactive mode
    if (!ticker) {
      input = await runInteractive();
      isInteractive = true;
    } else {
      // Validate required options when using direct mode
      if (!options.thesis) {
        console.error(
          'Error: --thesis is required when providing ticker directly'
        );
        console.error('Run without arguments for interactive mode');
        process.exit(1);
      }

      if (!options.goal) {
        console.error(
          'Error: --goal is required when providing ticker directly'
        );
        console.error('Run without arguments for interactive mode');
        process.exit(1);
      }

      input = {
        ticker,
        investmentThesis: options.thesis,
        goal: options.goal,
        saveTo: options.saveTo,
      };
    }

    // Generate the report
    await ReportGenerator.generate({
      input,
      model: options.model,
      interactive: isInteractive,
      enableFactCheck: options.factCheck || input.enableFactCheck || false,
    });
  } catch (error) {
    console.error(
      '\n❌ Error:',
      error instanceof Error ? error.message : String(error)
    );

    // Provide helpful hints for common errors
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        console.error(
          '\n💡 Tip: Make sure you have set up your API keys in .env file or config'
        );
        console.error('   See README.md for setup instructions');
      } else if (error.message.includes('Invalid ticker')) {
        console.error(
          '\n💡 Tip: Make sure the ticker symbol is valid (e.g., AAPL, MSFT, GOOGL)'
        );
      } else if (error.message.includes('rate limit')) {
        console.error(
          '\n💡 Tip: Alpha Vantage free tier has a limit of 25 calls/day'
        );
        console.error('   Try again tomorrow or upgrade your API plan');
      }
    }

    process.exit(1);
  }
}

// Configure the analyze command
program
  .command('analyze')
  .description('Generate equity research report for a stock')
  .argument('[ticker]', 'Stock ticker symbol (omit for interactive mode)')
  .option('-t, --thesis <thesis>', 'Your investment thesis')
  .option('-g, --goal <goal>', 'Analysis goal')
  .option('-s, --save-to <path>', 'Directory to save report')
  .option(
    '-m, --model <model>',
    'AI model: haiku (fast/cheap), sonnet (balanced), opus (thorough)',
    'sonnet'
  )
  .option(
    '-f, --fact-check',
    'Enable web search fact-checking (adds ~$0.10-0.15 per report)'
  )
  .action(handleAnalyze);

// Make 'analyze' the default command
program
  .argument('[ticker]', 'Stock ticker symbol (omit for interactive mode)')
  .option('-t, --thesis <thesis>', 'Your investment thesis')
  .option('-g, --goal <goal>', 'Analysis goal')
  .option('-s, --save-to <path>', 'Directory to save report')
  .option(
    '-m, --model <model>',
    'AI model: haiku (fast/cheap), sonnet (balanced), opus (thorough)',
    'sonnet'
  )
  .option(
    '-f, --fact-check',
    'Enable web search fact-checking (adds ~$0.10-0.15 per report)'
  )
  .action(handleAnalyze);

program.parse();
