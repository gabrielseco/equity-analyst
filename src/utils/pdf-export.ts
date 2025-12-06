import { marked } from 'marked';
import puppeteer from 'puppeteer';
import { join } from 'path';
import { mkdir } from 'fs/promises';
import type { AnalysisReport } from '../models/types';
import { MarkdownExporter } from './markdown-export';

export class PdfExporter {
  /**
   * Generate PDF from report (converts markdown to PDF)
   */
  static async savePDF(
    report: AnalysisReport,
    savePath: string
  ): Promise<string> {
    // Reuse existing markdown generation
    const markdown = MarkdownExporter.generateMarkdown(report);

    // Convert to styled HTML
    const htmlContent = await marked(markdown);
    const styledHTML = this.wrapWithStyles(htmlContent);

    // Generate PDF
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(styledHTML, { waitUntil: 'networkidle0' });

    // Create filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${timestamp}-${report.ticker.toLowerCase()}-analysis.pdf`;
    const fullPath = join(savePath, filename);

    // Ensure directory exists
    await mkdir(savePath, { recursive: true });

    // Generate PDF with professional settings
    await page.pdf({
      path: fullPath,
      format: 'A4',
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm',
      },
      printBackground: true,
      preferCSSPageSize: true,
    });

    await browser.close();

    return fullPath;
  }

  /**
   * Wrap HTML content with professional styling
   */
  private static wrapWithStyles(content: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            /* Base styles */
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', Arial, sans-serif;
              max-width: 800px;
              margin: 0 auto;
              padding: 40px 20px;
              line-height: 1.6;
              color: #333;
            }
            
            /* Headers */
            h1 {
              color: #1a1a1a;
              font-size: 28px;
              border-bottom: 3px solid #0066cc;
              padding-bottom: 12px;
              margin-bottom: 20px;
            }
            
            h2 {
              color: #2c3e50;
              font-size: 22px;
              margin-top: 40px;
              margin-bottom: 15px;
              border-bottom: 2px solid #e0e0e0;
              padding-bottom: 8px;
            }
            
            h3 {
              color: #34495e;
              font-size: 18px;
              margin-top: 25px;
              margin-bottom: 12px;
            }
            
            /* Text */
            p {
              margin: 12px 0;
              text-align: justify;
            }
            
            strong {
              color: #2c3e50;
              font-weight: 600;
            }
            
            /* Horizontal rules */
            hr {
              border: none;
              border-top: 1px solid #e0e0e0;
              margin: 30px 0;
            }
            
            /* Tables */
            table {
              border-collapse: collapse;
              width: 100%;
              margin: 20px 0;
              font-size: 14px;
            }
            
            th, td {
              border: 1px solid #ddd;
              padding: 12px;
              text-align: left;
            }
            
            th {
              background-color: #0066cc;
              color: white;
              font-weight: 600;
            }
            
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            
            tr:hover {
              background-color: #f0f0f0;
            }
            
            /* Lists */
            ul, ol {
              margin: 15px 0;
              padding-left: 30px;
            }
            
            li {
              margin: 8px 0;
            }
            
            /* Code blocks */
            code {
              background-color: #f4f4f4;
              padding: 2px 6px;
              border-radius: 3px;
              font-family: 'Courier New', monospace;
              font-size: 13px;
            }
            
            pre {
              background-color: #f4f4f4;
              padding: 15px;
              border-radius: 5px;
              overflow-x: auto;
            }
            
            pre code {
              background-color: transparent;
              padding: 0;
            }
            
            /* Footer disclaimer */
            em {
              color: #666;
              font-size: 12px;
            }
            
            /* Page breaks for printing */
            @media print {
              h1, h2 {
                page-break-after: avoid;
              }
              
              table {
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `;
  }
}
