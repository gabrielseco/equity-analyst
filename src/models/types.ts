export interface AnalysisInput {
  ticker: string;
  investmentThesis: string;
  goal: string;
  saveTo?: string;
  enableFactCheck?: boolean;
  pdf?: boolean;
  pdfOnly?: boolean;
}

export interface CompanyOverview {
  name: string;
  symbol: string;
  sector?: string;
  industry?: string;
  marketCap?: string;
  description?: string;
  exchange?: string;
  currency?: string;
}

export interface FinancialMetrics {
  // Income Statement
  revenue?: string;
  revenueGrowthYoY?: string;
  grossProfit?: string;
  grossMargin?: string;
  operatingIncome?: string;
  operatingMargin?: string;
  netIncome?: string;
  netMargin?: string;
  eps?: string;

  // Balance Sheet
  totalAssets?: string;
  totalLiabilities?: string;
  totalEquity?: string;

  // Cash Flow
  freeCashFlow?: string;
  operatingCashFlow?: string;

  // Valuation
  peRatio?: string;
  pbRatio?: string;
  evToEbitda?: string;
  dividendYield?: string;
}

export interface StockQuote {
  price: string;
  change: string;
  changePercent: string;
  high: string;
  low: string;
  open: string;
  previousClose: string;
  volume: string;
  fiftyTwoWeekHigh?: string;
  fiftyTwoWeekLow?: string;
}

export interface FinancialData {
  overview: CompanyOverview;
  quote: StockQuote;
  metrics: FinancialMetrics;
  dataSource: string;
  fetchedAt: string;
}

export interface FactCheckResult {
  claim: string;
  status: 'verified' | 'partially-verified' | 'conflicting' | 'not-found';
  sources: {
    url: string;
    title: string;
    snippet: string;
    date?: string;
  }[];
  notes?: string;
}

export interface AnalysisReport {
  ticker: string;
  companyName: string;
  investmentThesis: string;
  goal: string;
  analysis: string;
  generatedAt: string;
  financialData: FinancialData;
  factCheckEnabled?: boolean;
  searchCount?: number;
  factChecks?: FactCheckResult[];
  searchUsage?: {
    searchCount: number;
    searchCost: number;
  };
}

export interface Config {
  defaultReportsDir?: string;
  defaultModel?: 'haiku' | 'sonnet' | 'opus';
}
