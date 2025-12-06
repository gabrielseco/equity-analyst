# Equity Research Analyst CLI

An AI-powered equity research tool that generates professional stock analysis reports using Claude AI and real-time financial data. Get comprehensive fundamental analysis, thesis validation, and investment recommendations in minutes.

## Features

- **Interactive CLI** - Guided prompts for easy use
- **Real Financial Data** - Integrates with Alpha Vantage API for live market data
- **AI-Powered Analysis** - Uses Claude AI for professional-grade research reports
- **Professional Reports** - Generates markdown reports following equity research best practices
- **Flexible Models** - Choose between Haiku (fast), Sonnet (balanced), or Opus (thorough)
- **Customizable** - Support for custom analysis goals and investment theses

## Report Structure

Each generated report includes:

1. **Fundamental Analysis** - Revenue trends, margins, cash flow, valuation metrics
2. **Thesis Validation** - Supporting arguments, counter-arguments, and verdict
3. **Sector & Macro View** - Industry analysis and macroeconomic factors
4. **Catalyst Watch** - Short-term and long-term catalysts
5. **Investment Summary** - Key takeaways, recommendation, and confidence level

## Installation

```bash
bun install
```

## Setup

### 1. Get API Keys

You'll need two API keys:

#### Anthropic API Key (Required)
- Sign up at [Anthropic Console](https://console.anthropic.com/)
- Create a new API key
- **Cost**: Pay-as-you-go (Sonnet ~$0.10-0.30 per report)

#### Alpha Vantage API Key (Required)
- Get a FREE key at [Alpha Vantage](https://www.alphavantage.co/support/#api-key)
- Free tier: 25 API calls per day
- **Cost**: Free (or $50/month for premium)

### 2. Configure Environment

Create a `.env` file:

```bash
cp .env.example .env
```

Edit `.env` and add your keys:

```env
ANTHROPIC_API_KEY=sk-ant-your-key-here
ALPHA_VANTAGE_API_KEY=your-alpha-vantage-key-here
```

**Note**: Bun automatically loads `.env` files - no additional setup needed!

### 3. (Optional) Create Config File

For persistent settings, create `.equity-analyst.config.json`:

```json
{
  "defaultReportsDir": "./reports",
  "defaultModel": "sonnet",
  "apiKeys": {
    "anthropic": "sk-ant-...",
    "alphaVantage": "..."
  }
}
```

Config file locations (checked in order):
1. `./.equity-analyst.config.json` (project root)
2. `~/.equity-analyst.config.json` (home directory)

## Usage

### Interactive Mode (Recommended)

Simply run without arguments for a guided experience:

```bash
bun run start
```

The tool will prompt you for:
1. Stock ticker (e.g., AAPL, MSFT, GOOGL)
2. Your investment thesis
3. Analysis goal
4. Save location

### Direct Mode

Provide all arguments directly:

```bash
bun run start AAPL \
  --thesis "Apple's services revenue will drive growth despite iPhone saturation" \
  --goal "Evaluate for long-term portfolio addition" \
  --save-to ./my-reports
```

### Command Options

```bash
bun run start [ticker] [options]

Arguments:
  ticker                    Stock ticker symbol (e.g., AAPL, MSFT)

Options:
  -t, --thesis <thesis>     Your investment thesis
  -g, --goal <goal>         Analysis goal
  -s, --save-to <path>      Directory to save report (default: ./reports)
  -m, --model <model>       AI model: haiku, sonnet, opus (default: sonnet)
  -h, --help                Display help
```

### Model Selection

Choose the right model for your needs:

- **haiku** - Fast & cheap (~$0.05/report, 30s)
  - Best for: Quick checks, multiple analyses

- **sonnet** - Balanced (~$0.15/report, 45s) ⭐ **Recommended**
  - Best for: Most use cases, good quality/speed balance

- **opus** - Most thorough (~$0.40/report, 60s)
  - Best for: Deep analysis, important decisions

Example:

```bash
bun run start TSLA --model opus \
  --thesis "Tesla's energy business is undervalued" \
  --goal "Assess 5-year investment potential"
```

## Example Workflow

### 1. Run the tool

```bash
$ bun run start

📈 Equity Research Analyst - Interactive Mode

Enter stock ticker or company name: AAPL
✓ Analyzing: AAPL

What is your investment thesis?
  > Apple's wearables and services segments will offset iPhone decline

What is your analysis goal?
  Examples:
  - "Evaluate for long-term hold"
  - "Assess short-term trading opportunity"
  > Evaluate as core portfolio holding

Where should I save the report?
  (press Enter for default: ./reports)
  >
✓ Report will be saved to: ./reports
```

### 2. Wait for analysis

```bash
🔍 Fetching financial data...

📊 Fetching financial data for AAPL...
💰 Fetching current quote...
✓ Financial data fetched successfully

🤖 Generating equity research report...
✓ Analysis generated successfully

💾 Saving report...
✅ Report saved successfully!
📄 Location: ./reports/2025-12-06-aapl-analysis.md
```

### 3. Review your report

The generated markdown file includes:
- Executive summary
- Detailed fundamental analysis
- Thesis validation with supporting/counter arguments
- Sector analysis
- Catalysts to watch
- Investment recommendation

## Report Example

```markdown
# Equity Research Report: AAPL

**Company**: Apple Inc.
**Generated**: December 6, 2025
**Analyst**: Claude Sonnet 4.5

## Investment Context

### Investment Thesis
Apple's wearables and services segments will offset iPhone decline

### Analysis Goal
Evaluate as core portfolio holding

## 1. Fundamental Analysis

[Detailed analysis of revenue, margins, cash flow, valuation...]

## 2. Thesis Validation

### Supporting Arguments
1. Services revenue grew 15% YoY...
2. Wearables segment shows strong momentum...
3. Apple's ecosystem creates switching costs...

### Counter-Arguments / Risks
1. iPhone still represents 50% of revenue...
2. Services growth may plateau as penetration matures...

### Final Verdict
**Stance**: Bullish

[Analysis...]

[... rest of report ...]
```

## API Rate Limits

### Alpha Vantage (Free Tier)
- **25 calls per day**
- **5 calls per minute**

Each analysis uses **2 API calls** (overview + quote), so you can generate ~12 reports per day.

💡 **Tip**: Cache is planned for Phase 2 to reduce API calls!

### Anthropic
- Pay-as-you-go pricing
- No daily limits (just your budget)

## Troubleshooting

### "API rate limit reached"

**Cause**: Alpha Vantage free tier limits (25 calls/day)

**Solutions**:
- Wait until tomorrow
- Upgrade to Alpha Vantage premium ($50/month for 75 calls/minute)
- Use different API key

### "Invalid ticker symbol"

**Cause**: Ticker not found in Alpha Vantage database

**Solutions**:
- Verify ticker symbol (e.g., AAPL not APL)
- Check if stock is listed on major US exchanges
- Some international stocks may not be available

### "API key not found"

**Cause**: Environment variables not set

**Solutions**:
- Create `.env` file with your keys
- Or add to config file
- Or set environment variables manually

### "Failed to fetch financial data"

**Cause**: Network issues or API downtime

**Solutions**:
- Check internet connection
- Verify API key is valid
- Try again in a few minutes

## International Stocks

Alpha Vantage supports international exchanges:

```bash
# London Stock Exchange
bun run start BP.LON

# Toronto Stock Exchange
bun run start SHOP.TRT

# Note: Availability varies - US stocks work best
```

## Development

### Project Structure

```
equity-analyst/
├── src/
│   ├── index.ts              # CLI entry point
│   ├── config/
│   │   └── settings.ts       # Configuration management
│   ├── services/
│   │   ├── anthropic.ts      # Claude API client
│   │   ├── financial-data.ts # Alpha Vantage integration
│   │   └── report-generator.ts
│   ├── prompts/
│   │   └── analyst-prompt.ts # Analysis prompt template
│   ├── models/
│   │   └── types.ts          # TypeScript interfaces
│   └── utils/
│       ├── interactive.ts    # CLI prompts
│       └── markdown-export.ts
├── reports/                  # Generated reports
├── .env.example
├── package.json
└── README.md
```

### Build Standalone Binary

Create a portable executable:

```bash
bun run build
# Creates ./equity-analyst executable

./equity-analyst AAPL --thesis "..." --goal "..."
```

### Add to PATH (Optional)

For system-wide access:

```bash
# Add to ~/.zshrc or ~/.bashrc
alias eq="bun run /path/to/equity-analyst/src/index.ts"

# Reload shell
source ~/.zshrc

# Now use anywhere
eq MSFT
```

## Built With

- [Bun](https://bun.sh) - Fast all-in-one JavaScript runtime
- [Anthropic SDK](https://github.com/anthropics/anthropic-sdk-typescript) - Claude AI API
- [Alpha Vantage API](https://www.alphavantage.co/) - Financial data
- [Commander.js](https://github.com/tj/commander.js) - CLI framework
- TypeScript

## Roadmap

### Phase 2 - Enhanced Features (Coming Soon)
- Git-based report versioning
- API response caching (24hr TTL)
- Peer comparison analysis
- Rate limit handling

### Phase 3 - Polish & UX
- Rich CLI output (spinners, progress bars)
- Mermaid charts in reports
- Comprehensive testing
- PDF export

### Future Enhancements
- Batch analysis (multiple tickers)
- Portfolio mode
- Custom report templates
- Web dashboard
- Alert system for catalysts

## Cost Estimation

### Per Report
- **Alpha Vantage**: Free (25/day limit)
- **Claude Sonnet**: ~$0.10-0.30
- **Total**: ~$0.10-0.30 per report

### Monthly (50 reports)
- **Alpha Vantage**: Free or $50 (premium)
- **Claude**: ~$5-15
- **Total**: $5-65/month depending on usage

💡 **Tip**: Use Haiku model for quick analyses to save costs!

## Disclaimer

This tool generates AI-powered analysis for informational purposes only. It is **NOT financial advice**.

- Always conduct your own research
- Consult with a qualified financial advisor
- Understand the risks before investing
- Past performance doesn't guarantee future results

## License

MIT

## Support

Found a bug or have a feature request? Open an issue on GitHub!
