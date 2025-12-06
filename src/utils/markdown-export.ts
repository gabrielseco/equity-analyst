import { mkdir } from 'fs/promises';
import { join } from 'path';
import type { AnalysisReport } from '../models/types';

export class MarkdownExporter {
  /**
   * Generate markdown report content
   */
  static generateMarkdown(report: AnalysisReport): string {
    const {
      ticker,
      companyName,
      investmentThesis,
      goal,
      analysis,
      generatedAt,
      financialData,
      factCheckEnabled,
      searchCount,
    } = report;

    const factCheckBadge = factCheckEnabled
      ? ` | ✓ Fact-Checked${
          searchCount ? ` (${searchCount} web searches)` : ''
        }`
      : '';

    return `# Equity Research Report: ${ticker.toUpperCase()}

**Company**: ${companyName}
**Generated**: ${new Date(generatedAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })}
**Analyst**: Claude ${this.getModelName()}
**Data Source**: ${financialData.dataSource}${factCheckBadge}

---

## Investment Context

### Investment Thesis
${investmentThesis}

### Analysis Goal
${goal}

---

${analysis}

---

## Data Reference

### Price as of Analysis
- **Current Price**: $${financialData.quote.price}
- **Change**: ${financialData.quote.change} (${
      financialData.quote.changePercent
    })
- **52-Week Range**: $${financialData.quote.fiftyTwoWeekLow || 'N/A'} - $${
      financialData.quote.fiftyTwoWeekHigh || 'N/A'
    }

### Key Metrics
| Metric | Value |
|--------|-------|
| Market Cap | ${
      financialData.overview.marketCap
        ? `$${(parseInt(financialData.overview.marketCap) / 1e9).toFixed(2)}B`
        : 'N/A'
    } |
| P/E Ratio | ${financialData.metrics.peRatio || 'N/A'} |
| Revenue (TTM) | ${
      financialData.metrics.revenue
        ? `$${(parseInt(financialData.metrics.revenue) / 1e9).toFixed(2)}B`
        : 'N/A'
    } |
| Revenue Growth YoY | ${
      financialData.metrics.revenueGrowthYoY
        ? (parseFloat(financialData.metrics.revenueGrowthYoY) * 100).toFixed(
            2
          ) + '%'
        : 'N/A'
    } |
| Net Margin | ${financialData.metrics.netMargin || 'N/A'} |
| Operating Cash Flow | ${
      financialData.metrics.operatingCashFlow
        ? `$${(parseInt(financialData.metrics.operatingCashFlow) / 1e9).toFixed(
            2
          )}B`
        : 'N/A'
    } |

---

*This report was generated using AI analysis and should not be considered financial advice. Always conduct your own research and consult with a qualified financial advisor before making investment decisions.*
`;
  }

  /**
   * Save report to file
   */
  static async saveReport(
    report: AnalysisReport,
    savePath: string
  ): Promise<string> {
    const markdown = this.generateMarkdown(report);
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const filename = `${timestamp}-${report.ticker.toLowerCase()}-analysis.md`;
    const fullPath = join(savePath, filename);

    // Ensure directory exists
    await mkdir(savePath, { recursive: true });

    // Write file
    await Bun.write(fullPath, markdown);

    return fullPath;
  }

  /**
   * Get Claude model name from environment or default
   */
  private static getModelName(): string {
    // This will be set from the actual model used
    return 'Sonnet 4.5';
  }
}
