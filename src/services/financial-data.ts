import type {
  CompanyOverview,
  FinancialMetrics,
  StockQuote,
  FinancialData,
} from "../models/types";

const ALPHA_VANTAGE_BASE_URL = "https://www.alphavantage.co/query";

export class FinancialDataService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Search for ticker symbol by company name
   */
  private async searchSymbol(query: string): Promise<
    {
      symbol: string;
      name: string;
      type: string;
      region: string;
      matchScore: string;
    }[]
  > {
    const url = `${ALPHA_VANTAGE_BASE_URL}?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(
      query
    )}&apikey=${this.apiKey}`;

    try {
      const response = await fetch(url);
      const data = (await response.json()) as {
        "Error Message"?: string;
        Note?: string;
        bestMatches?: any[];
      };

      if (data["Error Message"]) {
        throw new Error(`Symbol search failed: ${data["Error Message"]}`);
      }

      if (data["Note"]) {
        throw new Error("API rate limit reached. Please try again later.");
      }

      if (!data.bestMatches || data.bestMatches.length === 0) {
        throw new Error(`No matches found for "${query}"`);
      }

      return data.bestMatches.map((match: any) => ({
        symbol: match["1. symbol"],
        name: match["2. name"],
        type: match["3. type"],
        region: match["4. region"],
        matchScore: match["9. matchScore"],
      }));
    } catch (error) {
      throw new Error(
        `Failed to search symbol: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Resolve input to a valid ticker symbol
   * Returns the ticker symbol if input is already a ticker, or searches for it if it's a company name
   */
  async resolveTickerSymbol(
    input: string,
    interactive: boolean = false
  ): Promise<{
    symbol: string;
    name: string;
    isResolved: boolean;
  }> {
    const inputUpper = input.toUpperCase().trim();

    // First, try to check if input is already a valid ticker by attempting to fetch overview
    // This is a quick check - if it works, we don't need to search
    try {
      const url = `${ALPHA_VANTAGE_BASE_URL}?function=OVERVIEW&symbol=${inputUpper}&apikey=${this.apiKey}`;
      const response = await fetch(url);
      const data = (await response.json()) as any;

      // If we get valid data back, it's already a ticker
      if (data.Symbol && !data["Error Message"] && !data["Note"]) {
        return {
          symbol: data.Symbol,
          name: data.Name || inputUpper,
          isResolved: false, // Input was already a valid ticker
        };
      }
    } catch (error) {
      // If overview check fails, fall through to search
    }

    // If we get here, input is likely a company name - search for it
    console.log(`🔍 Searching for ticker symbol for "${input}"...`);
    const matches = await this.searchSymbol(input);

    // Filter for US equity matches
    const equityMatches = matches.filter(
      (match) => match.type === "Equity" && match.region === "United States"
    );

    if (equityMatches.length === 0) {
      // Fall back to all matches if no US equities found
      if (matches.length > 0) {
        return {
          symbol: matches[0]?.symbol || "",
          name: matches[0]?.name || "",
          isResolved: true,
        };
      }
      throw new Error(`No ticker symbol found for "${input}"`);
    }

    // If multiple matches and in interactive mode, let user choose
    if (interactive && equityMatches.length > 1) {
      const choice = await this.promptForSymbolChoice(equityMatches);
      return {
        symbol: choice.symbol,
        name: choice.name,
        isResolved: true,
      };
    }

    // Return the best match (highest match score)
    const bestMatch = equityMatches[0];
    console.log(
      `✓ Found ${equityMatches.length} match(es). Using best match: ${bestMatch?.symbol} - ${bestMatch?.name}`
    );
    return {
      symbol: bestMatch?.symbol || "",
      name: bestMatch?.name || "",
      isResolved: true,
    };
  }

  /**
   * Prompt user to choose from multiple ticker matches
   */
  private async promptForSymbolChoice(
    matches: {
      symbol: string;
      name: string;
      type: string;
      region: string;
      matchScore: string;
    }[]
  ): Promise<{ symbol: string; name: string }> {
    const readline = await import("readline");

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    console.log(`\nFound ${matches.length} matches:`);
    matches.forEach((match, index) => {
      console.log(
        `  ${index + 1}. ${match.symbol} - ${match.name} (Match: ${(
          parseFloat(match.matchScore) * 100
        ).toFixed(0)}%)`
      );
    });

    return new Promise((resolve) => {
      const askChoice = () => {
        rl.question(`\nSelect a ticker (1-${matches.length}): `, (answer) => {
          const choice = parseInt(answer.trim());
          if (choice >= 1 && choice <= matches.length) {
            const selected = matches[choice - 1];
            console.log(
              `✓ Selected: ${selected?.symbol} - ${selected?.name}\n`
            );
            rl.close();
            resolve({
              symbol: selected?.symbol || "",
              name: selected?.name || "",
            });
          } else {
            console.log(
              `❌ Invalid choice. Please enter a number between 1 and ${matches.length}.`
            );
            askChoice();
          }
        });
      };
      askChoice();
    });
  }

  /**
   * Fetch company overview data
   */
  private async fetchOverview(ticker: string): Promise<CompanyOverview> {
    const url = `${ALPHA_VANTAGE_BASE_URL}?function=OVERVIEW&symbol=${ticker}&apikey=${this.apiKey}`;

    try {
      const response = await fetch(url);
      const data = (await response.json()) as {
        "Error Message"?: string;
        Note?: string;
        Name?: string;
        Symbol?: string;
        Sector?: string;
        Industry?: string;
        MarketCapitalization?: string;
        Description?: string;
        Exchange?: string;
        Currency?: string;
      };

      // Check for API errors
      if (data["Error Message"]) {
        throw new Error(`Invalid ticker symbol: ${ticker}`);
      }

      if (data["Note"]) {
        throw new Error("API rate limit reached. Please try again later.");
      }

      return {
        name: data.Name || ticker,
        symbol: data.Symbol || ticker,
        sector: data.Sector,
        industry: data.Industry,
        marketCap: data.MarketCapitalization,
        description: data.Description,
        exchange: data.Exchange,
        currency: data.Currency,
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch company overview: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Fetch current stock quote
   */
  private async fetchQuote(ticker: string): Promise<StockQuote> {
    const url = `${ALPHA_VANTAGE_BASE_URL}?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${this.apiKey}`;

    try {
      const response = await fetch(url);
      const data = (await response.json()) as any;

      const quote = data["Global Quote"];

      if (!quote || Object.keys(quote).length === 0) {
        throw new Error(`No quote data available for ${ticker}`);
      }

      return {
        price: quote["05. price"] || "0",
        change: quote["09. change"] || "0",
        changePercent: quote["10. change percent"] || "0%",
        high: quote["03. high"] || "0",
        low: quote["04. low"] || "0",
        open: quote["02. open"] || "0",
        previousClose: quote["08. previous close"] || "0",
        volume: quote["06. volume"] || "0",
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch stock quote: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Fetch balance sheet data
   */
  private async fetchBalanceSheet(ticker: string): Promise<{
    totalAssets?: string;
    totalLiabilities?: string;
    totalEquity?: string;
  }> {
    const url = `${ALPHA_VANTAGE_BASE_URL}?function=BALANCE_SHEET&symbol=${ticker}&apikey=${this.apiKey}`;

    try {
      const response = await fetch(url);
      const data = (await response.json()) as any;

      // Check for errors
      if (data["Error Message"] || data["Note"]) {
        return {}; // Return empty object if balance sheet not available
      }

      // Get the most recent annual report
      const annualReports = data.annualReports;
      if (!annualReports || annualReports.length === 0) {
        return {};
      }

      const latestReport = annualReports[0];

      return {
        totalAssets: latestReport.totalAssets,
        totalLiabilities: latestReport.totalLiabilities,
        totalEquity: latestReport.totalShareholderEquity,
      };
    } catch (error) {
      console.warn(
        `⚠️  Could not fetch balance sheet: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return {};
    }
  }

  /**
   * Fetch cash flow data
   */
  private async fetchCashFlow(ticker: string): Promise<{
    operatingCashFlow?: string;
    freeCashFlow?: string;
  }> {
    const url = `${ALPHA_VANTAGE_BASE_URL}?function=CASH_FLOW&symbol=${ticker}&apikey=${this.apiKey}`;

    try {
      const response = await fetch(url);
      const data = (await response.json()) as any;

      // Check for errors
      if (data["Error Message"] || data["Note"]) {
        return {}; // Return empty object if cash flow not available
      }

      // Get the most recent annual report
      const annualReports = data.annualReports;
      if (!annualReports || annualReports.length === 0) {
        return {};
      }

      const latestReport = annualReports[0];

      // Calculate free cash flow if not directly available
      const operatingCashFlow = latestReport.operatingCashflow;
      const capitalExpenditures = latestReport.capitalExpenditures;
      let freeCashFlow = latestReport.freeCashFlow;

      // If free cash flow is not provided, calculate it
      if (!freeCashFlow && operatingCashFlow && capitalExpenditures) {
        const ocf = parseFloat(operatingCashFlow);
        const capex = parseFloat(capitalExpenditures);
        if (!isNaN(ocf) && !isNaN(capex)) {
          freeCashFlow = (ocf - Math.abs(capex)).toString();
        }
      }

      return {
        operatingCashFlow,
        freeCashFlow,
      };
    } catch (error) {
      console.warn(
        `⚠️  Could not fetch cash flow: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return {};
    }
  }

  /**
   * Parse financial metrics from overview data
   */
  private parseMetrics(
    overviewData: any,
    balanceSheet?: any,
    cashFlow?: any
  ): FinancialMetrics {
    return {
      revenue: overviewData.RevenueTTM,
      revenueGrowthYoY: overviewData.QuarterlyRevenueGrowthYOY,
      grossProfit: overviewData.GrossProfitTTM,
      grossMargin:
        overviewData.GrossProfitTTM && overviewData.RevenueTTM
          ? (
              (parseFloat(overviewData.GrossProfitTTM) /
                parseFloat(overviewData.RevenueTTM)) *
              100
            ).toFixed(2) + "%"
          : undefined,
      operatingIncome: overviewData.OperatingIncomeTTM,
      operatingMargin: overviewData.OperatingMarginTTM,
      netIncome: overviewData.NetIncomeTTM,
      netMargin: overviewData.ProfitMargin,
      eps: overviewData.EPS,
      // Balance sheet data from dedicated endpoint
      totalAssets: balanceSheet?.totalAssets,
      totalLiabilities: balanceSheet?.totalLiabilities,
      totalEquity: balanceSheet?.totalEquity,
      // Cash flow data from dedicated endpoint
      operatingCashFlow: cashFlow?.operatingCashFlow,
      freeCashFlow: cashFlow?.freeCashFlow,
      peRatio: overviewData.PERatio,
      pbRatio: overviewData.PriceToBookRatio,
      evToEbitda: overviewData.EVToEBITDA,
      dividendYield: overviewData.DividendYield,
    };
  }

  /**
   * Fetch complete financial data for a ticker
   */
  async fetchFinancialData(
    ticker: string,
    interactive: boolean = false
  ): Promise<FinancialData> {
    // Resolve ticker symbol (handles both tickers and company names)
    const resolved = await this.resolveTickerSymbol(ticker, interactive);

    if (resolved.isResolved) {
      console.log(
        `✅ Resolved "${ticker}" to ${resolved.symbol} (${resolved.name})`
      );
    }

    const tickerUpper = resolved.symbol.toUpperCase();

    console.log(`📊 Fetching financial data for ${tickerUpper}...`);

    // Fetch overview data (contains most metrics)
    const url = `${ALPHA_VANTAGE_BASE_URL}?function=OVERVIEW&symbol=${tickerUpper}&apikey=${this.apiKey}`;
    const response = await fetch(url);
    const overviewData = (await response.json()) as any;

    // Check for errors
    if (overviewData["Error Message"]) {
      throw new Error(`Invalid ticker symbol: ${tickerUpper}`);
    }

    if (overviewData["Note"]) {
      throw new Error(
        "API rate limit reached (25 calls/day). Please try again later or use cached data."
      );
    }

    // Parse overview
    const overview = await this.fetchOverview(tickerUpper);

    // Fetch quote separately to get latest price
    console.log(`💰 Fetching current quote...`);
    const quote = await this.fetchQuote(tickerUpper);

    // Fetch balance sheet and cash flow data
    console.log(`📋 Fetching balance sheet...`);
    const balanceSheet = await this.fetchBalanceSheet(tickerUpper);

    console.log(`💸 Fetching cash flow statement...`);
    const cashFlow = await this.fetchCashFlow(tickerUpper);

    // Parse metrics with all available data
    const metrics = this.parseMetrics(overviewData, balanceSheet, cashFlow);

    // Add 52-week high/low from overview
    quote.fiftyTwoWeekHigh = overviewData["52WeekHigh"];
    quote.fiftyTwoWeekLow = overviewData["52WeekLow"];

    return {
      overview,
      quote,
      metrics,
      dataSource: "Alpha Vantage",
      fetchedAt: new Date().toISOString(),
    };
  }

  /**
   * Format financial data for display in the analysis prompt
   */
  static formatForPrompt(data: FinancialData): string {
    const { overview, quote, metrics } = data;

    return `
## Company Information
- **Name**: ${overview.name}
- **Ticker**: ${overview.symbol}
- **Sector**: ${overview.sector || "N/A"}
- **Industry**: ${overview.industry || "N/A"}
- **Market Cap**: ${
      overview.marketCap
        ? `$${(parseInt(overview.marketCap) / 1e9).toFixed(2)}B`
        : "N/A"
    }
- **Exchange**: ${overview.exchange || "N/A"}

## Current Stock Data
- **Price**: $${quote.price}
- **Change**: ${quote.change} (${quote.changePercent})
- **Day Range**: $${quote.low} - $${quote.high}
- **52-Week Range**: $${quote.fiftyTwoWeekLow || "N/A"} - $${
      quote.fiftyTwoWeekHigh || "N/A"
    }
- **Volume**: ${parseInt(quote.volume).toLocaleString()}

## Financial Metrics (TTM)
### Profitability
- **Revenue**: ${
      metrics.revenue
        ? `$${(parseInt(metrics.revenue) / 1e9).toFixed(2)}B`
        : "N/A"
    }
- **Revenue Growth YoY**: ${
      metrics.revenueGrowthYoY
        ? (parseFloat(metrics.revenueGrowthYoY) * 100).toFixed(2) + "%"
        : "N/A"
    }
- **Gross Margin**: ${metrics.grossMargin || "N/A"}
- **Operating Margin**: ${metrics.operatingMargin || "N/A"}
- **Net Margin**: ${metrics.netMargin || "N/A"}
- **EPS**: $${metrics.eps || "N/A"}

### Balance Sheet
- **Total Assets**: ${
      metrics.totalAssets
        ? `$${(parseFloat(metrics.totalAssets) / 1e9).toFixed(2)}B`
        : "N/A"
    }
- **Total Liabilities**: ${
      metrics.totalLiabilities
        ? `$${(parseFloat(metrics.totalLiabilities) / 1e9).toFixed(2)}B`
        : "N/A"
    }
- **Shareholder Equity**: ${
      metrics.totalEquity
        ? `$${(parseFloat(metrics.totalEquity) / 1e9).toFixed(2)}B`
        : "N/A"
    }
- **Debt-to-Equity Ratio**: ${
      metrics.totalLiabilities && metrics.totalEquity
        ? (
            parseFloat(metrics.totalLiabilities) /
            parseFloat(metrics.totalEquity)
          ).toFixed(2)
        : "N/A"
    }

### Cash Flow
- **Operating Cash Flow**: ${
      metrics.operatingCashFlow
        ? `$${(parseFloat(metrics.operatingCashFlow) / 1e9).toFixed(2)}B`
        : "N/A"
    }
- **Free Cash Flow**: ${
      metrics.freeCashFlow
        ? `$${(parseFloat(metrics.freeCashFlow) / 1e9).toFixed(2)}B`
        : "N/A"
    }
- **FCF Margin**: ${
      metrics.freeCashFlow && metrics.revenue
        ? (
            (parseFloat(metrics.freeCashFlow) / parseFloat(metrics.revenue)) *
            100
          ).toFixed(2) + "%"
        : "N/A"
    }

### Valuation
- **P/E Ratio**: ${metrics.peRatio || "N/A"}
- **P/B Ratio**: ${metrics.pbRatio || "N/A"}
- **EV/EBITDA**: ${metrics.evToEbitda || "N/A"}
- **Dividend Yield**: ${metrics.dividendYield || "N/A"}

## Company Description
${overview.description || "No description available"}
`.trim();
  }
}
