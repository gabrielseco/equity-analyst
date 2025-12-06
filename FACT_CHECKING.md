# Fact-Checking Feature

## Overview

The Equity Analyst tool now supports **web search fact-checking** powered by Anthropic's Claude API. When enabled, Claude will verify key claims in the report by searching the internet for current information.

## How It Works

### Architecture

1. **Web Search Integration**: Uses Anthropic's built-in `web_search_20250305` tool
2. **Server-Side Execution**: All searches are handled by Anthropic's infrastructure
3. **Moderate Scope**: Configured to perform 10-15 strategic searches per report
4. **Real-Time Verification**: Searches happen during report generation (not as a separate step)

### What Gets Fact-Checked

Claude strategically verifies:
- ✓ Key financial metrics (vs. recent earnings reports/SEC filings)
- ✓ Recent news and analyst ratings
- ✓ Major company events and announcements
- ✓ Sector trends and macroeconomic data
- ✓ Current stock price and market sentiment

### Report Features

When fact-checking is enabled, reports include:

1. **Verification Badges** (inline):
   - ✓ **Verified**: Claim confirmed by authoritative sources
   - ⚠ **Partially Verified**: Some aspects confirmed
   - ⚡ **Updated**: New information found that updates the analysis
   - ❌ **Conflicting**: Data that contradicts the claim

2. **Inline Citations**: `[Source Name, Date](URL)`

3. **Fact-Check Summary Section**: Dedicated table at end of report showing:
   - All verified claims
   - Verification status
   - Source links
   - Statistics on verification results

## Usage

### Enable Fact-Checking

Add the `--fact-check` (or `-f`) flag to any analysis command:

```bash
# Interactive mode with fact-checking
bun run start --fact-check

# Direct mode with fact-checking
bun run start AAPL \
  --thesis "Apple's services revenue will drive growth" \
  --goal "Evaluate long-term hold potential" \
  --fact-check
```

### Cost Implications

**Without fact-checking:**
- Cost: ~$0.05-0.15 per report (model-dependent)
- Only token costs apply

**With fact-checking:**
- Additional cost: ~$0.10-0.15 per report (10-15 searches)
- Web search pricing: $10 per 1,000 searches
- Total: ~$0.15-0.30 per report

The cost estimator in the CLI will show the breakdown including search costs.

## Requirements

### API Access

**Important**: Your Anthropic organization administrator must enable web search in the [Anthropic Console](https://console.anthropic.com).

Without web search enabled on your account, the `--fact-check` flag will fail with an API error.

### API Keys

Ensure your `.env` file has:
```env
ANTHROPIC_API_KEY=your-key-here
ALPHA_VANTAGE_API_KEY=your-key-here
```

## Example Output

Here's what a fact-checked report section looks like:

### Sample: Fundamental Analysis Section

```markdown
## 1. Fundamental Analysis

### Revenue Trends ✓ Verified
Apple reported $119.58B in quarterly revenue (Q4 2024), representing 6% YoY growth.
[Apple Q4 2024 Earnings Report, Oct 31 2024](https://www.apple.com/newsroom/2024/10/apple-reports-fourth-quarter-results/)

### Valuation Assessment ⚡ Updated
Current P/E ratio: 31.2x (vs. sector average 28.5x). However, recent analyst consensus
shows upward price target revisions following strong iPhone 16 demand.
[MarketWatch, Dec 5 2024](https://www.marketwatch.com/story/apple-stock-analysts-raise-targets)
```

### Sample: Fact-Check Summary Section

```markdown
## 6. Fact-Check Summary

| Claim | Status | Sources | Notes |
|-------|--------|---------|-------|
| Q4 revenue of $119.58B | ✓ | [Apple IR](url), [SEC Filing](url) | Confirmed from official sources |
| Services revenue growth 12% | ✓ | [Apple Earnings](url) | Verified in earnings call |
| iPhone 16 demand strong | ⚡ | [Reuters](url), [Bloomberg](url) | Updated: Better than initially reported |
| P/E ratio 31.2x | ✓ | [Yahoo Finance](url) | Verified Dec 6, 2024 |

**Verification Statistics:**
- Total claims verified: 12
- Fully verified: 9
- Partially verified: 2
- Updated with new info: 1
- Conflicting data found: 0
```

## Technical Details

### Implementation

- **File**: `src/services/anthropic.ts` - Web search tool integration
- **Prompt**: `src/prompts/analyst-prompt.ts` - Fact-checking instructions
- **Types**: `src/models/types.ts` - FactCheckResult interface
- **CLI**: `src/index.ts` - --fact-check flag

### Configuration

- **Max searches per report**: 15 (configured in `anthropic.ts`)
- **Search budget**: Moderate (10-15 searches recommended in prompt)
- **Search timing**: During report generation (not post-processing)

### Limitations

1. **API Availability**: Web search must be enabled by org admin
2. **Search Cap**: Limited to 15 searches per report (configurable)
3. **Cost**: Adds ~$0.10-0.15 per report
4. **Model Support**: Works with all Claude models (Haiku, Sonnet, Opus)

## Troubleshooting

### Error: "Tool not available"

**Cause**: Web search not enabled for your Anthropic organization

**Solution**: Contact your org admin to enable web search in the Anthropic Console, or remove the `--fact-check` flag

### High Search Costs

**Cause**: Claude performing more searches than expected

**Solution**: The search limit is capped at 15 per report in the code. If costs are still high, consider:
- Using Haiku model for cheaper token costs
- Disabling fact-checking for initial drafts
- Only enabling for final reports

### No Citations in Output

**Cause**: Claude may not always find relevant sources

**Solution**: This is normal. The prompt instructs Claude to search strategically. If a claim doesn't need verification (e.g., mathematical calculations), Claude won't search for it.

## Future Enhancements

Potential improvements:
- [ ] Configurable search budget via CLI flag
- [ ] Post-generation fact-checking mode
- [ ] Fact-check specific sections only
- [ ] Export citations to BibTeX/EndNote
- [ ] Confidence scores for each claim
