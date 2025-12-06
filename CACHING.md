# Financial Data Caching

## Overview

The Equity Analyst tool automatically caches financial data for **24 hours** to reduce API calls and improve performance.

## How It Works

### First Fetch (Cache Miss)

When you analyze a stock for the first time in a day:

```bash
bun run start AAPL --thesis "Services growth" --goal "Long-term hold"
```

Output:
```
📊 Fetching financial data for AAPL...
💰 Fetching current quote...
📋 Fetching balance sheet...
💸 Fetching cash flow statement...
✓ Data cached for 24 hours
```

The tool:
1. Fetches data from Alpha Vantage API (5 API calls)
2. Saves data to `.cache/financial-data/AAPL-2025-12-06.json`
3. Uses the fresh data for analysis

### Subsequent Fetches (Cache Hit)

When you analyze the same stock again on the same day:

```bash
bun run start AAPL --thesis "iPhone demand" --goal "Short-term trade"
```

Output:
```
✓ Using cached data for AAPL (fetched today)
   Data source: Alpha Vantage | Cached at: 2:30:45 PM
```

The tool:
1. Loads data instantly from cache (0 API calls)
2. Uses cached data for analysis
3. Allows you to iterate on thesis/goal without API limits

## Cache Storage

### Location

```
.cache/
  financial-data/
    AAPL-2025-12-06.json
    MSFT-2025-12-06.json
    GOOGL-2025-12-06.json
```

### File Format

Each cache file contains the complete `FinancialData` object:

```json
{
  "overview": {
    "name": "Apple Inc.",
    "symbol": "AAPL",
    "sector": "Technology",
    ...
  },
  "quote": {
    "price": "195.42",
    ...
  },
  "metrics": {
    "revenue": "383285000000",
    ...
  },
  "dataSource": "Alpha Vantage",
  "fetchedAt": "2025-12-06T14:30:45.123Z"
}
```

### Cache Key

Format: `{TICKER}-{YYYY-MM-DD}.json`

Examples:
- `AAPL-2025-12-06.json` (Apple, Dec 6 2025)
- `MSFT-2025-12-07.json` (Microsoft, Dec 7 2025)

The date-based key ensures cache expires daily at midnight.

## Benefits

### API Call Reduction

**Without cache:**
- Each analysis = 5 API calls
- 5 analyses of AAPL = 25 API calls (daily limit!)

**With cache:**
- First analysis = 5 API calls
- Next 4 analyses = 0 API calls
- Total = 5 API calls

### Speed Improvement

- Cache hit: **~10ms** (read from disk)
- API fetch: **~5-10 seconds** (multiple network requests)

### Workflow Enhancement

You can now:
- ✅ Try different investment theses on the same stock
- ✅ Refine your analysis goal multiple times
- ✅ Compare different AI models on identical data
- ✅ Generate multiple reports for the same stock
- ✅ Stay well within free tier limits (25 calls/day)

## Cache Expiry

### Automatic Daily Expiry

Cache expires automatically:
- Files are named with the current date
- Next day = different filename = cache miss
- Old cache files remain on disk but are ignored

### Why 24 Hours?

Financial data doesn't change minute-to-minute:
- Company fundamentals: Updated quarterly
- Balance sheets: Annual/quarterly
- Most metrics: Updated daily at best

24-hour caching is a perfect balance:
- ✅ Fresh enough for analysis
- ✅ Long enough to be useful
- ✅ Aligns with trading day cycle

## Manual Cache Management

### View Cache

```bash
ls -lh .cache/financial-data/
```

### Clear All Cache

```bash
rm -rf .cache/financial-data/
```

### Clear Specific Stock

```bash
rm .cache/financial-data/AAPL-*.json
```

### Clear Old Cache (7+ days)

```bash
find .cache/financial-data/ -name "*.json" -mtime +7 -delete
```

## Troubleshooting

### Cache Not Working

**Symptom:** Always fetching from API, never seeing "Using cached data"

**Causes:**
1. Different ticker format (AAPL vs aapl) - *Should work, tickers are normalized*
2. `.cache` directory doesn't have write permissions
3. Cache files being deleted between runs

**Solution:**
```bash
# Check cache directory
ls -la .cache/financial-data/

# Check permissions
ls -ld .cache

# Manually create if needed
mkdir -p .cache/financial-data
```

### Stale Data

**Symptom:** Want fresh data but cache is being used

**Solution:** Delete the cache file for that stock:
```bash
rm .cache/financial-data/AAPL-$(date +%Y-%m-%d).json
```

Or wait until tomorrow - cache will expire automatically.

### Disk Space

Each cache file is ~5-10 KB. Even 100 cached stocks = ~1 MB.

To clean up old cache files periodically:
```bash
# Delete cache files older than 30 days
find .cache/financial-data/ -name "*.json" -mtime +30 -delete
```

## Technical Details

### Implementation

**File:** `src/services/financial-data.ts`

**Key Methods:**
```typescript
private getCachedData(ticker: string): FinancialData | null
private cacheData(ticker: string, data: FinancialData): void
```

**Cache Check:**
```typescript
const cached = this.getCachedData(tickerUpper);
if (cached) {
  console.log(`✓ Using cached data for ${tickerUpper} (fetched today)`);
  return cached;
}
```

### Error Handling

Cache operations are **non-critical**:
- Cache read error → Fetch from API (no failure)
- Cache write error → Warning logged, analysis continues
- Cache directory missing → Created automatically

The app will **always work** even if caching fails.

## Future Enhancements

Potential improvements:
- [ ] `--no-cache` flag to force fresh fetch
- [ ] `--clear-cache` command to clean up old files
- [ ] Configurable cache duration (env variable)
- [ ] Cache statistics (hit rate, size, etc.)
- [ ] Background cache cleanup on startup

## Summary

✅ **Automatic** - No configuration needed  
✅ **Fast** - Instant data loading for cached stocks  
✅ **Smart** - Daily expiry keeps data fresh  
✅ **Efficient** - Dramatically reduces API calls  
✅ **Transparent** - Clear indicators when cache is used  

The caching system makes the tool more practical for daily use while respecting API rate limits. 🚀
