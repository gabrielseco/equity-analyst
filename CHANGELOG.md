# Changelog

## [Unreleased] - 2025-12-06

### Added 24-Hour Smart Caching for Financial Data

Implemented automatic caching of financial data to reduce API calls and improve performance.

#### Changes

**1. Cache Implementation**

- Financial data is now cached for 24 hours after first fetch
- Cache files stored in `.cache/financial-data/` directory
- Cache key format: `{TICKER}-{YYYY-MM-DD}.json`
- Automatic cache directory creation

**2. User-Visible Improvements**

- Clear cache hit indicator: `✓ Using cached data for AAPL (fetched today)`
- Shows when data was originally cached: `Data source: Alpha Vantage | Cached at: 2:30:45 PM`
- Cache miss shows: `✓ Data cached for 24 hours` after successful fetch

**3. Benefits**

- ✅ Dramatically reduces API calls (5 calls → 0 for repeat analyses)
- ✅ Instant data loading for cached tickers
- ✅ Allows multiple report iterations with different theses/goals
- ✅ Helps stay within Alpha Vantage free tier limits (25 calls/day)
- ✅ Zero configuration required - works automatically

**Technical Details:**

- Modified file: `src/services/financial-data.ts`
- Added imports: `fs`, `path`
- New methods: `getCachedData()`, `cacheData()`
- Updated method: `fetchFinancialData()` - checks cache before API call
- Cache directory already in `.gitignore`

### Enhanced Fact-Checking User Communication

Improved user awareness and transparency when fact-checking is enabled.

#### Changes

**1. Pre-Analysis Notification**

- Added clear notification before Claude API call when fact-checking is enabled
- Shows estimated time and cost impact: "This may add 15-30 seconds and ~$0.10-0.15 to the cost"

**2. Improved Console Output**

- Changed spinner text from "Calling Claude API..." to "Generating analysis..."
- Split success message into multiple lines for better readability
- Added detailed cost breakdown showing token costs vs. search costs separately
- Example output:
  ```
  ✓ Analysis generated
     Tokens: 5,200 in / 3,800 out (9,000 total)
     Web searches: 12 performed
     Cost breakdown: $0.15 (tokens) + $0.12 (searches) = $0.27 total
  ```

**3. Post-Report Summary**

- Added comprehensive summary after report is saved showing:
  - Company name and ticker
  - Model used
  - Fact-checking status (✓ Enabled / ✗ Disabled)
  - Number of web searches performed (if applicable)
  - Total cost
- Example:
  ```
  📊 Report Summary:
     Company: Meta Platforms Inc. (META)
     Model: sonnet
     Fact-checking: ✓ Enabled
     Web searches: 12 performed
     Total cost: $0.2712
  ```

**4. Report Header Badge**

- Added fact-checking indicator to markdown report header
- Shows in report: `**Data Source**: Alpha Vantage | ✓ Fact-Checked (12 web searches)`
- Makes it immediately clear when viewing the report whether it was fact-checked

**5. Interactive Mode Prompt**

- Added explicit fact-checking prompt in interactive mode
- Defaults to "Yes" for convenience
- Shows cost and time implications upfront
- Example:
  ```
  Enable fact-checking with web search?
    This will verify claims using current sources (+15-30 seconds, +$0.10-0.15 cost)
    (Y/n) >
  ```

#### Technical Changes

**Modified Files:**

- `src/services/report-generator.ts`: Enhanced console output with detailed statistics and summary
- `src/models/types.ts`: Added `factCheckEnabled` and `searchCount` fields to `AnalysisReport` and `enableFactCheck` to `AnalysisInput`
- `src/utils/markdown-export.ts`: Added fact-check badge to report header
- `src/utils/interactive.ts`: Added fact-checking prompt in interactive mode
- `src/index.ts`: Updated to handle fact-check flag from both CLI and interactive mode

**User Experience Improvements:**

- ✅ Users now see clear notification before fact-checking starts
- ✅ Detailed cost breakdown shows exactly what they're paying for
- ✅ Post-report summary provides complete transparency
- ✅ Report header makes fact-checking status persistent
- ✅ Interactive mode explicitly asks about fact-checking

**Benefits:**

1. **Transparency**: Users always know when fact-checking is active
2. **Cost Awareness**: Clear breakdown of token vs. search costs
3. **Discoverability**: Interactive users learn about fact-checking feature
4. **Documentation**: Report header preserves fact-checking status
5. **Debugging**: Easier to troubleshoot when users can see search counts
