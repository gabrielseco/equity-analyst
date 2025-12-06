# Fact-Checking User Experience

## Before vs After Comparison

### BEFORE (Old Experience)

User had minimal visibility into fact-checking:

```
🔍 Fetching financial data...
✓ Financial data fetched successfully

⠋ Calling Claude API (sonnet) with fact-checking enabled...
✓ Analysis generated | Tokens: 5,200 in / 3,800 out (9,000 total) | Est. cost: $0.27 (including 12 web searches)

💾 Saving report...
✅ Report saved successfully!
📄 Location: ./reports/2025-12-06-meta-analysis.md
```

**Issues:**

- ❌ No warning before fact-checking starts
- ❌ Minimal indication (just part of spinner text)
- ❌ Cost breakdown unclear (lumped together)
- ❌ No summary after completion
- ❌ Report doesn't show it was fact-checked

---

### AFTER (New Experience)

#### 1. Interactive Mode Now Asks Explicitly

```
Where should I save the report?
  (press Enter for default: ./reports)
  >
✓ Report will be saved to: ./reports

Enable fact-checking with web search?
  This will verify claims using current sources (+15-30 seconds, +$0.10-0.15 cost)
  (Y/n) > y
✓ Fact-checking enabled
```

#### 2. Clear Pre-Analysis Notification

```
🔍 Fetching financial data...
✓ Financial data fetched successfully

🔍 Fact-checking enabled - Claude will verify claims using web search
   (This may add 15-30 seconds and ~$0.10-0.15 to the cost)

⠋ Generating analysis with fact-checking (sonnet)...
```

#### 3. Detailed Statistics on Completion

```
✓ Analysis generated
   Tokens: 5,200 in / 3,800 out (9,000 total)
   Web searches: 12 performed
   Cost breakdown: $0.1500 (tokens) + $0.1200 (searches) = $0.2700 total

💾 Saving report...
```

#### 4. Comprehensive Post-Report Summary

```
✅ Report saved successfully!
📄 Location: ./reports/2025-12-06-meta-analysis.md

📊 Report Summary:
   Company: Meta Platforms Inc. (META)
   Model: sonnet
   Fact-checking: ✓ Enabled
   Web searches: 12 performed
   Total cost: $0.2700
```

#### 5. Report Header Shows Fact-Checking Status

The generated markdown now includes:

```markdown
# Equity Research Report: META

**Company**: Meta Platforms Inc.
**Generated**: December 6, 2025 at 01:44 PM
**Analyst**: Claude Sonnet 4.5
**Data Source**: Alpha Vantage | ✓ Fact-Checked (12 web searches)
```

---

## Benefits

### For Users

✅ **Know what to expect** - See cost and time impact upfront  
✅ **Understand what they paid for** - Detailed cost breakdown  
✅ **Trust the output** - Clear indication when data was verified  
✅ **Make informed decisions** - Can opt-in/out in interactive mode

### For Debugging

✅ **Visible search counts** - Easy to verify fact-checking ran  
✅ **Clear cost attribution** - Separate token vs search costs  
✅ **Report metadata** - Header shows fact-check status permanently

### For Adoption

✅ **Feature discovery** - Interactive users learn about fact-checking  
✅ **Transparency builds trust** - Users see the value they're getting  
✅ **Cost justification** - Clear breakdown shows where money goes

---

## CLI Flag Behavior

### Direct Mode (with flags)

```bash
# Without fact-checking (default)
bun run start AAPL --thesis "..." --goal "..."
# → No fact-checking prompts or notifications

# With fact-checking
bun run start AAPL --thesis "..." --goal "..." --fact-check
# → Shows all fact-checking notifications and breakdowns
```

### Interactive Mode

```bash
bun run start
# → Always asks about fact-checking
# → User can enable/disable each run
# → Defaults to "Yes" for convenience
```

---

## Cost Transparency Examples

### Without Fact-Checking

```
✓ Analysis generated
   Tokens: 5,200 in / 3,800 out (9,000 total)
   Estimated cost: $0.1500
```

### With Fact-Checking (Low Searches)

```
✓ Analysis generated
   Tokens: 5,200 in / 3,800 out (9,000 total)
   Web searches: 5 performed
   Cost breakdown: $0.1500 (tokens) + $0.0500 (searches) = $0.2000 total
```

### With Fact-Checking (High Searches)

```
✓ Analysis generated
   Tokens: 5,200 in / 3,800 out (9,000 total)
   Web searches: 15 performed
   Cost breakdown: $0.1500 (tokens) + $0.1500 (searches) = $0.3000 total
```

---

## Implementation Summary

**Files Modified:**

- ✅ `src/services/report-generator.ts` - Console output improvements
- ✅ `src/models/types.ts` - Added fact-check fields to types
- ✅ `src/utils/markdown-export.ts` - Report header badge
- ✅ `src/utils/interactive.ts` - Fact-check prompt
- ✅ `src/index.ts` - Handle fact-check from interactive mode

**Zero Breaking Changes:**

- Existing CLI flags work identically
- Default behavior unchanged (fact-checking off by default)
- All enhancements are additive
