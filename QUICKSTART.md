# Quick Start Guide

This guide will get you up and running with the Equity Research Analyst tool in 5 minutes.

## Prerequisites

- Bun installed (https://bun.sh)
- Anthropic API key
- Alpha Vantage API key (free)

## Setup Steps

### 1. Install Dependencies

```bash
cd equity-analyst
bun install
```

### 2. Get API Keys

**Anthropic API Key:**

1. Go to https://console.anthropic.com/
2. Sign up / Log in
3. Create a new API key
4. Copy it

**Alpha Vantage API Key (FREE):**

1. Go to https://www.alphavantage.co/support/#api-key
2. Enter your email
3. Get instant FREE API key
4. Copy it

Export the keys in your terminal

```env
ANTHROPIC_API_KEY=sk-ant-api-xxxxx
ALPHA_VANTAGE_API_KEY=your_key_here
```

### 4. Run Your First Analysis

```bash
bun run start
```

Follow the prompts:

- **Ticker**: `AAPL`
- **Thesis**: `Apple's services segment will drive future growth`
- **Goal**: `Evaluate for long-term investment`
- **Save location**: Press Enter (uses default `./reports`)

### 5. View Your Report

The tool will generate a markdown file in `./reports/` with:

- Financial analysis
- Thesis validation
- Investment recommendation
- Market catalysts

Open it with any markdown viewer or text editor!

## Example Direct Usage

Skip interactive mode by providing all arguments:

```bash
bun run start MSFT \
  --thesis "Cloud computing dominance justifies premium valuation" \
  --goal "Assess for retirement portfolio" \
  --model sonnet
```

## Choose Your Model

- `haiku` - Fast & cheap (~30s, $0.05)
- `sonnet` - Balanced (~45s, $0.15) ⭐ Default
- `opus` - Most thorough (~60s, $0.40)

```bash
bun run start TSLA --model opus \
  --thesis "Electric vehicle leadership position" \
  --goal "Short-term trading opportunity"
```

## Daily Limits

**Alpha Vantage Free Tier:**

- 25 API calls per day
- Each analysis uses 2 calls
- **You can generate ~12 reports per day**

## Troubleshooting

**"API rate limit reached"**
→ You've hit the 25 calls/day limit. Wait until tomorrow or upgrade.

**"Invalid ticker"**
→ Check spelling (e.g., `AAPL` not `APL`)

**"API key not found"**
→ Make sure your `.env` file exists and has the keys

## Next Steps

1. Read the full [README.md](./README.md) for all features
2. Customize the config file for your preferences
3. Build a standalone binary: `bun run build`
4. Add an alias to your shell for easy access

## Support

Questions? Check:

- README.md for detailed documentation
- .env.example for configuration template
- GitHub issues for known problems

Happy analyzing! 📈
