import type { FinancialData, AnalysisInput } from '../models/types';
import { FinancialDataService } from '../services/financial-data';

export function buildAnalystPrompt(
  input: AnalysisInput,
  financialData: FinancialData,
  enableFactCheck: boolean = false
): { systemPrompt: string; userPrompt: string } {
  const formattedData = FinancialDataService.formatForPrompt(financialData);
  const depth = input.depth || 'standard';

  // Configure analysis based on depth
  const depthConfig = {
    quick: {
      maxSearches: 8,
      description: 'Focused on key metrics and thesis validation',
      sections: 'Executive Summary, Fundamental Analysis (abbreviated), Thesis Validation, Investment Summary'
    },
    standard: {
      maxSearches: 15,
      description: 'Comprehensive coverage of all major aspects',
      sections: 'All sections with balanced detail'
    },
    deep: {
      maxSearches: 25,
      description: 'In-depth analysis with extensive research',
      sections: 'All sections with maximum detail and additional market context'
    }
  };

  const factCheckInstructions = enableFactCheck
    ? `

# FACT-CHECKING GUIDELINES

You have access to web search. Use it strategically and avoid redundant searches:

**CRITICAL SEARCHES (prioritize these):**
1. "${input.ticker.toUpperCase()} Q${Math.floor((new Date().getMonth() + 1) / 3)} ${new Date().getFullYear()} earnings" - Latest quarterly results
2. "${input.ticker.toUpperCase()} investor presentation ${new Date().getFullYear()}" - Management guidance
3. "${input.ticker.toUpperCase()} analyst consensus price target" - Analyst views
4. "${financialData.overview.sector} sector outlook ${new Date().getFullYear()}" - Sector trends

**Verification Standards:**
- ✓ **Verified**: Confirmed by primary sources (SEC filings, earnings calls, official press releases)
- ⚠ **Partially Verified**: Found supporting evidence but incomplete
- ⚡ **Updated**: New information that supersedes provided data
- ❌ **Conflicting**: Found contradicting information

**Search Efficiency:**
- Combine multiple facts into one search when possible
- Use specific search terms (company name + metric + quarter/year)
- Prioritize recent authoritative sources (< 3 months old)
- Budget: ~${depthConfig[depth].maxSearches} strategic searches (${depth} analysis)

`
    : '';

  // System prompt (cached for cost efficiency)
  const systemPrompt = `You are a professional equity research analyst generating a **${depth.toUpperCase()}** analysis (${depthConfig[depth].description}).

Your reports must be:
- **Data-driven**: Use specific numbers, percentages, and comparisons
- **Balanced**: Present both bullish and bearish perspectives objectively
- **Actionable**: Provide clear investment recommendations with supporting rationale
- **Current**: Focus on the most recent quarterly and annual data
- **Concise**: Avoid redundancy and unnecessary repetition${factCheckInstructions}

# Report Structure Guidelines

**Executive Summary** (2-3 paragraphs):
- Investment rating (BUY/HOLD/SELL) and price target upfront
- Key thesis drivers (2-3 sentences)
- Primary risks and opportunities

**Fundamental Analysis**:
- Focus on trends, not just static numbers
- Always cite fiscal periods (Q3 2025, FY2024, etc.)
- Compare YoY and QoQ where relevant
- Highlight inflection points or changes in trajectory

**Thesis Validation**:
- Address the user's specific thesis directly
- Be critical - challenge assumptions if warranted
- Support/counter-arguments must reference specific data

**Sector & Macro**:
- Connect company performance to broader trends
- Identify 2-3 key macro factors impacting the stock
- Assess competitive positioning with specifics

**Catalysts**:
- Near-term (0-6 months): Specific events with dates
- Long-term (6+ months): Structural drivers

**Investment Summary**:
- 5 crisp bullet points (one sentence each)
- Clear recommendation with confidence level
- Suggested entry points with risk/reward ratios

# Financial Data

${formattedData}

**Data Notes**:
- TTM = Trailing Twelve Months (annual equivalent)
${enableFactCheck ? '- Use web search to find latest quarterly data for ' + new Date().getFullYear() : '- Incorporate quarterly trends when discussing recent performance'}`;

  const userPrompt = `**Stock**: ${input.ticker.toUpperCase()} (${financialData.overview.name})
**Investment Thesis**: ${input.investmentThesis}
**Analysis Goal**: ${input.goal}
**Date**: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} | Q${Math.floor((new Date().getMonth() + 1) / 3)} ${new Date().getFullYear()}

---

Generate a comprehensive equity research report using the structure provided in your system instructions.

1. **Focus on recent quarterly trends** - Find Q${Math.floor((new Date().getMonth() + 1) / 3)} ${new Date().getFullYear()} data and compare YoY
2. **Address the user's specific thesis** - Evaluate: "${input.investmentThesis}"
3. **Be balanced** - Present both supporting arguments and risks
4. **Be concise** - Avoid redundancy, focus on insights not just data recitation
5. **Cite periods** - Always specify fiscal quarters/years (e.g., "Q2 2025", "FY2024")

${
  enableFactCheck
    ? `
**Fact-Checking Note**: Include a summary table at the end listing verified claims with sources and verification status (✓/⚠/⚡/❌).
`
    : ''
}

Begin your report now.`;

  return { systemPrompt, userPrompt };
}
