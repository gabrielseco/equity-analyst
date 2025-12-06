export interface AnalysisInput {
  ticker: string;
  investmentThesis: string;
  goal: string;
  saveTo?: string;
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

export interface AnalysisReport {
  ticker: string;
  companyName: string;
  investmentThesis: string;
  goal: string;
  analysis: string;
  generatedAt: string;
  financialData: FinancialData;
}

export interface Config {
  defaultReportsDir?: string;
  defaultModel?: 'haiku' | 'sonnet' | 'opus';
}
