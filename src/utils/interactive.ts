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
        console.log(
          '❌ Please provide a meaningful investment thesis (at least 10 characters).\n'
        );
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
        console.log(
          '❌ Please provide a clear analysis goal (at least 10 characters).\n'
        );
        continue;
      }

      goal = input;
      break;
    }

    // Step 4: Get save location
    const defaultDir = await getDefaultReportsDir();
    console.log(`\nWhere should I save the report?`);
    const saveInput = await question(
      rl,
      `  (press Enter for default: ${defaultDir})\n  > `
    );
    const saveTo = saveInput || defaultDir;

    console.log(`✓ Report will be saved to: ${saveTo}\n`);

    // Step 5: Ask about fact-checking
    console.log('Enable fact-checking with web search?');
    console.log(
      '  This will verify claims using current sources (+15-30 seconds, +$0.10-0.15 cost)'
    );
    const factCheckInput = await question(rl, '  (Y/n) > ');
    const enableFactCheck =
      !factCheckInput ||
      factCheckInput.toLowerCase() === 'y' ||
      factCheckInput.toLowerCase() === 'yes';

    if (enableFactCheck) {
      console.log('✓ Fact-checking enabled\n');
    } else {
      console.log('✓ Fact-checking disabled\n');
    }

    // Step 6: Ask about PDF export
    console.log('Generate PDF version for easy sharing?');
    console.log(
      '  Markdown will always be generated. PDF adds a shareable format (+2-3 seconds)'
    );
    const pdfInput = await question(rl, '  (Y/n) > ');
    const generatePdf =
      !pdfInput ||
      pdfInput.toLowerCase() === 'y' ||
      pdfInput.toLowerCase() === 'yes';

    if (generatePdf) {
      console.log('✓ PDF export enabled\n');
    } else {
      console.log('✓ PDF export disabled\n');
    }

    rl.close();

    return {
      ticker,
      investmentThesis,
      goal,
      saveTo,
      enableFactCheck,
      pdf: generatePdf,
    };
  } catch (error) {
    rl.close();
    throw error;
  }
}
