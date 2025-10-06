/**
 * Professional Print Utilities for Growlio Dashboard
 * Enterprise-grade printing system with comprehensive error handling,
 * data validation, and professional formatting
 */

// Professional data validation and formatting utilities
const DataValidator = {
  /**
   * Safely parse numeric values with comprehensive validation
   * @param {any} value - The value to parse
   * @param {number} defaultValue - Default value if parsing fails
   * @returns {number} - Parsed number or default value
   */
  parseNumber: (value, defaultValue = 0) => {
    if (value === null || value === undefined || value === '') return defaultValue;
    if (typeof value === 'number') return isNaN(value) ? defaultValue : value;
    
    const parsed = parseFloat(String(value).replace(/[,$]/g, ''));
    return isNaN(parsed) ? defaultValue : parsed;
  },

  /**
   * Format currency with professional styling
   * @param {any} value - The value to format
   * @param {boolean} showZero - Whether to show zero values or dash
   * @returns {string} - Formatted currency string
   */
  formatCurrency: (value, showZero = true) => {
    const numValue = DataValidator.parseNumber(value);
    if (numValue === 0 && !showZero) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numValue);
  },

  /**
   * Format date with professional styling
   * @param {any} dateValue - The date value to format
   * @returns {string} - Formatted date string
   */
  formatDate: (dateValue) => {
    if (!dateValue) return 'N/A';
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit'
      });
    } catch (error) {
      return 'N/A';
    }
  },

  /**
   * Get profit/loss styling class
   * @param {number} value - The profit/loss value
   * @returns {string} - CSS class name
   */
  getProfitLossClass: (value) => {
    const numValue = DataValidator.parseNumber(value);
    if (numValue > 0) return 'profit-positive';
    if (numValue < 0) return 'profit-negative';
    return 'profit-neutral';
  }
};

// Professional HTML template generator
const HTMLTemplateGenerator = {
  /**
   * Generate comprehensive CSS for professional printing
   * @returns {string} - Complete CSS stylesheet
   */
  generatePrintCSS: () => `
            <style>
              @page {
                size: A4 landscape;
        margin: 0.5in;
        @top-center {
          content: "Growlio Business Report";
          font-size: 10px;
          color: #666;
        }
        @bottom-center {
          content: "Page " counter(page) " of " counter(pages);
          font-size: 10px;
          color: #666;
        }
      }
      
      * {
        box-sizing: border-box;
        -webkit-print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      
              body {
                margin: 0;
                padding: 0;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                font-size: 12px;
        line-height: 1.4;
        color: #333;
        background: white;
              }
      
      .print-container {
                width: 100%;
        max-width: none;
                margin: 0;
                padding: 0;
              }
      
      .report-header {
        text-align: center;
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 3px solid #f97316;
      }
      
      .report-title {
        font-size: 28px;
        font-weight: 700;
        color: #f97316;
        margin: 0 0 10px 0;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      
      .report-subtitle {
        font-size: 14px;
        color: #666;
        margin: 0 0 15px 0;
        font-weight: 500;
      }
      
      .report-meta {
        font-size: 11px;
        color: #888;
        margin: 0;
      }
      
      .data-table {
                width: 100%;
                border-collapse: collapse;
                margin: 0;
                font-size: 11px;
        background: white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        border-radius: 8px;
        overflow: hidden;
        table-layout: fixed;
      }
      
      .data-table th:nth-child(1),
      .data-table td:nth-child(1) {
        width: 15%;
      }
      
      .data-table th:nth-child(2),
      .data-table td:nth-child(2),
      .data-table th:nth-child(3),
      .data-table td:nth-child(3),
      .data-table th:nth-child(4),
      .data-table td:nth-child(4),
      .data-table th:nth-child(5),
      .data-table td:nth-child(5),
      .data-table th:nth-child(6),
      .data-table td:nth-child(6),
      .data-table th:nth-child(7),
      .data-table td:nth-child(7) {
        width: 14.2%;
      }
      
      .data-table thead {
        background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
        color: white;
      }
      
      .data-table th {
        padding: 12px 8px;
        text-align: left;
        font-weight: 700;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border: none;
        white-space: nowrap;
        vertical-align: middle;
        line-height: 1.2;
      }
      
      .data-table td {
        padding: 10px 8px;
        border-bottom: 1px solid #e5e7eb;
        font-size: 11px;
        vertical-align: middle;
        line-height: 1.2;
      }
      
      .data-table th:first-child,
      .data-table td:first-child {
        text-align: left;
        padding-left: 12px;
      }
      
      .data-table th:last-child,
      .data-table td:last-child {
        text-align: right;
        padding-right: 12px;
      }
      
      .data-table th:nth-child(2),
      .data-table th:nth-child(3),
      .data-table th:nth-child(4),
      .data-table th:nth-child(5),
      .data-table th:nth-child(6),
      .data-table th:nth-child(7),
      .data-table td:nth-child(2),
      .data-table td:nth-child(3),
      .data-table td:nth-child(4),
      .data-table td:nth-child(5),
      .data-table td:nth-child(6),
      .data-table td:nth-child(7) {
        text-align: right;
        padding-right: 12px;
      }
      
      .data-table tbody tr:nth-child(even) {
        background-color: #f9fafb;
      }
      
      .data-table tbody tr:hover {
        background-color: #f3f4f6;
      }
      
      .currency-cell {
        text-align: right;
        font-weight: 600;
        font-family: 'Courier New', monospace;
        padding-right: 12px !important;
        white-space: nowrap;
      }
      
      .date-cell {
        font-weight: 600;
        color: #374151;
        text-align: left;
        padding-left: 12px !important;
        white-space: nowrap;
      }
      
      .profit-positive {
        color: #059669;
        font-weight: 700;
      }
      
      .profit-negative {
        color: #dc2626;
        font-weight: 700;
      }
      
      .profit-neutral {
        color: #6b7280;
        font-weight: 600;
      }
      
      .summary-section {
        margin-top: 30px;
        padding: 20px;
        background: #f8fafc;
        border-radius: 8px;
        border-left: 4px solid #f97316;
      }
      
      .summary-title {
        font-size: 16px;
        font-weight: 700;
        color: #1f2937;
        margin: 0 0 15px 0;
      }
      
      .summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
      }
      
      .summary-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid #e5e7eb;
      }
      
      .summary-label {
        font-weight: 600;
        color: #4b5563;
      }
      
      .summary-value {
        font-weight: 700;
        font-family: 'Courier New', monospace;
      }
      
      @media print {
        body { -webkit-print-color-adjust: exact; }
        .data-table { page-break-inside: avoid; }
        .summary-section { page-break-inside: avoid; }
      }
    </style>
  `,

  /**
   * Generate professional report header
   * @param {string} title - Report title
   * @param {string} subtitle - Report subtitle
   * @returns {string} - HTML header section
   */
  generateHeader: (title, subtitle = '') => `
    <div class="report-header">
      <h1 class="report-title">${title}</h1>
      ${subtitle ? `<p class="report-subtitle">${subtitle}</p>` : ''}
      <p class="report-meta">
        Generated on ${new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })} at ${new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        })}
      </p>
    </div>
  `,

  /**
   * Generate professional data table
   * @param {Array} data - Data array
   * @param {Array} columns - Column definitions
   * @returns {string} - HTML table
   */
  generateTable: (data, columns) => {
    if (!data || data.length === 0) {
      return '<p style="text-align: center; color: #666; font-style: italic;">No data available</p>';
    }

    const headerRow = columns.map(col => `<th>${col.title}</th>`).join('');
    const dataRows = data.map((row, index) => {
      const cells = columns.map(col => {
        const value = col.accessor ? col.accessor(row, index) : row[col.key];
        const formattedValue = col.formatter ? col.formatter(value) : value;
        const cellClass = col.cellClass ? col.cellClass(value) : '';
        return `<td class="${cellClass}">${formattedValue}</td>`;
      }).join('');
      return `<tr>${cells}</tr>`;
    }).join('');

    return `
      <table class="data-table">
        <thead>
          <tr>${headerRow}</tr>
        </thead>
        <tbody>
          ${dataRows}
        </tbody>
      </table>
    `;
  }
};

// Professional print handler with comprehensive error handling
const ProfessionalPrintHandler = {
  /**
   * Safely open print window with error handling
   * @param {string} htmlContent - HTML content to print
   * @param {string} title - Window title
   * @returns {boolean} - Success status
   */
  openPrintWindow: (htmlContent, title = 'Print Report') => {
    try {
      const printWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
      
      if (!printWindow) {
        throw new Error('Popup blocked by browser');
      }

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Wait for content to load before printing
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
          
          // Close window after printing (with delay for user to cancel if needed)
          setTimeout(() => {
            printWindow.close();
          }, 1000);
        }, 500);
      };

      return true;
    } catch (error) {
      console.error('Print error:', error);
      alert('Unable to open print dialog. Please check your browser settings.');
      return false;
    }
  }
};

// Main print utilities with professional implementation
export const printUtils = {
  /**
   * Handle Summary Dashboard printing with professional formatting
   * @param {Object} dashboardSummaryData - Dashboard data
   */
  handleSummaryPrint: (dashboardSummaryData) => {
    try {
      // Validate input data
      if (!dashboardSummaryData || !dashboardSummaryData.data || !Array.isArray(dashboardSummaryData.data)) {
        console.warn('Invalid dashboard data for printing');
        return;
      }

      const data = dashboardSummaryData.data;
      if (data.length === 0) {
        console.warn('No data available for printing');
        return;
      }

      // Define table columns with professional formatting
      const columns = [
        {
          title: 'Date',
          key: 'date',
          accessor: (row) => DataValidator.formatDate(row.date || row.day || row.month_start),
          cellClass: () => 'date-cell'
        },
        {
          title: 'Sales Budget',
          key: 'sales_budget',
          accessor: (row) => DataValidator.formatCurrency(row.sales_budget),
          cellClass: () => 'currency-cell'
        },
        {
          title: 'Labor Budget',
          key: 'labour',
          accessor: (row) => DataValidator.formatCurrency(row.labour),
          cellClass: () => 'currency-cell'
        },
        {
          title: 'Food Cost',
          key: 'food_cost',
          accessor: (row) => DataValidator.formatCurrency(row.food_cost),
          cellClass: () => 'currency-cell'
        },
        {
          title: 'Fixed Cost',
          key: 'fixed_cost',
          accessor: (row) => DataValidator.formatCurrency(row.fixed_cost),
          cellClass: () => 'currency-cell'
        },
        {
          title: 'Variable Cost',
          key: 'variable_cost',
          accessor: (row) => DataValidator.formatCurrency(row.variable_cost),
          cellClass: () => 'currency-cell'
        },
        {
          title: 'Profit/Loss',
          key: 'budgeted_profit_loss',
          accessor: (row) => DataValidator.formatCurrency(row.budgeted_profit_loss),
          cellClass: (value) => `currency-cell ${DataValidator.getProfitLossClass(value)}`
        }
      ];

      // Generate comprehensive HTML
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Budget Dashboard Report</title>
          ${HTMLTemplateGenerator.generatePrintCSS()}
        </head>
        <body>
          <div class="print-container">
            ${HTMLTemplateGenerator.generateHeader('Budget Dashboard Report', 'Financial Performance Analysis')}
            ${HTMLTemplateGenerator.generateTable(data, columns)}
          </div>
        </body>
        </html>
      `;

      // Open print window
      ProfessionalPrintHandler.openPrintWindow(htmlContent, 'Budget Dashboard Report');

    } catch (error) {
      console.error('Error in handleSummaryPrint:', error);
      alert('An error occurred while preparing the print document. Please try again.');
    }
  },

  /**
   * Handle Profit Loss Dashboard printing with professional formatting
   * @param {Array} tableData - Table data
   * @param {Array} dashboardData - Dashboard data
   * @param {Object} dashboardSummaryData - Summary data
   */
  handleProfitLossPrint: (tableData, dashboardData, dashboardSummaryData) => {
    try {
      // Determine the best data source with fallback logic
      let dataToUse = null;
      
      if (tableData && Array.isArray(tableData) && tableData.length > 0) {
        dataToUse = tableData;
      } else if (dashboardData && Array.isArray(dashboardData) && dashboardData.length > 0) {
        dataToUse = dashboardData;
      } else if (dashboardSummaryData && dashboardSummaryData.data && Array.isArray(dashboardSummaryData.data)) {
        dataToUse = dashboardSummaryData.data;
      }

      if (!dataToUse || dataToUse.length === 0) {
        console.warn('No valid data available for profit/loss printing');
        return;
      }

      // Define table columns with professional formatting
      const columns = [
        {
          title: 'Date',
          key: 'date',
          accessor: (row) => DataValidator.formatDate(row.date || row.day || row.month_start || row.week_start),
          cellClass: () => 'date-cell'
        },
        {
          title: 'Sales',
          key: 'sales',
          accessor: (row) => DataValidator.formatCurrency(row.sales || row.sales_actual || row.sales_budget),
          cellClass: () => 'currency-cell'
        },
        {
          title: 'Labor',
          key: 'labor',
          accessor: (row) => DataValidator.formatCurrency(row.labour || row.labor_actual || row.labour_budget),
          cellClass: () => 'currency-cell'
        },
        {
          title: 'Food Cost',
          key: 'food_cost',
          accessor: (row) => DataValidator.formatCurrency(row.food_cost || row.food_cost_actual || row.food_cost_budget),
          cellClass: () => 'currency-cell'
        },
        {
          title: 'Fixed Cost',
          key: 'fixed_cost',
          accessor: (row) => DataValidator.formatCurrency(row.fixed_cost || row.fixed_cost_actual || row.fixed_cost_budget),
          cellClass: () => 'currency-cell'
        },
        {
          title: 'Variable Cost',
          key: 'variable_cost',
          accessor: (row) => DataValidator.formatCurrency(row.variable_cost || row.variable_cost_actual || row.variable_cost_budget),
          cellClass: () => 'currency-cell'
        },
        {
          title: 'Profit/Loss',
          key: 'profit_loss',
          accessor: (row) => DataValidator.formatCurrency(row.profit_loss || row.profit_loss_actual || row.budgeted_profit_loss),
          cellClass: (value) => `currency-cell ${DataValidator.getProfitLossClass(value)}`
        }
      ];

      // Generate comprehensive HTML
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Profit Loss Dashboard Report</title>
          ${HTMLTemplateGenerator.generatePrintCSS()}
        </head>
        <body>
          <div class="print-container">
            ${HTMLTemplateGenerator.generateHeader('Profit & Loss Dashboard Report', 'Financial Performance Analysis')}
            ${HTMLTemplateGenerator.generateTable(dataToUse, columns)}
          </div>
        </body>
        </html>
      `;

      // Open print window
      ProfessionalPrintHandler.openPrintWindow(htmlContent, 'Profit Loss Dashboard Report');

    } catch (error) {
      console.error('Error in handleProfitLossPrint:', error);
      alert('An error occurred while preparing the print document. Please try again.');
    }
  }
};