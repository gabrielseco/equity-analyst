import * as readline from 'readline';
import type { AnalysisInput } from '../models/types';
import { getDefaultReportsDir } from '../config/settings';

/**
 * Create readline interface for prompts
 */
function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

/**
 * Ask a question and return the answer
 */
function question(rl: readline.Interface, prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer.trim());
    });
  });
}

/**
 * Validate ticker symbol format (basic validation)
 */
function validateTicker(ticker: string): boolean {
  // Allow 1-5 uppercase letters, possibly with a dot for international stocks
  return /^[A-Z]{1,5}(\.[A-Z]{1,2})?$/.test(ticker.toUpperCase());
}

/**
 * Run interactive mode to gather analysis parameters
 */
export async function runInteractive(): Promise<AnalysisInput> {
  const rl = createInterface();

  console.log('\n📈 Equity Research Analyst - Interactive Mode\n');

  try {
    // Step 1: Get ticker symbol
    let ticker = '';
    while (!ticker) {
      const input = await question(rl, 'Enter stock ticker or company name: ');
      const tickerUpper = input.toUpperCase();

      if (!input) {
        console.log('❌ Ticker cannot be empty.\n');
        continue;
      }

      // For simplicity, accept any input and let the API validate
      ticker = tickerUpper;
      console.log(`✓ Analyzing: ${ticker}\n`);
      break;
    }

    // Step 2: Get investment thesis
    let investmentThesis = '';
    while (!investmentThesis) {
      const input = await question(rl, 'What is your investment thesis?\n  > ');

      if (!input || input.length < 10) {
        console.log('❌ Please provide a meaningful investment thesis (at least 10 characters).\n');
        continue;
      }

      investmentThesis = input;
      break;
    }

    // Step 3: Get analysis goal
    let goal = '';
    console.log('\nWhat is your analysis goal?');
    console.log('  Examples:');
    console.log('  - "Evaluate for long-term hold"');
    console.log('  - "Assess short-term trading opportunity"');
    console.log('  - "Compare to competitors before buying"');
    console.log('  - "Validate recent price movement"\n');

    while (!goal) {
      const input = await question(rl, '  > ');

      if (!input || input.length < 10) {
        console.log('❌ Please provide a clear analysis goal (at least 10 characters).\n');
        continue;
      }

      goal = input;
      break;
    }

    // Step 4: Get save location
    const defaultDir = await getDefaultReportsDir();
    console.log(`\nWhere should I save the report?`);
    const saveInput = await question(rl, `  (press Enter for default: ${defaultDir})\n  > `);
    const saveTo = saveInput || defaultDir;

    console.log(`✓ Report will be saved to: ${saveTo}\n`);

    rl.close();

    return {
      ticker,
      investmentThesis,
      goal,
      saveTo,
    };
  } catch (error) {
    rl.close();
    throw error;
  }
}
