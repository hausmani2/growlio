// Print utility functions
export const printUtils = {
  // Handle print with options for Summary Dashboard
  handleSummaryPrint: (printOption, dashboardSummaryData) => {
    if (printOption === 'report-only') {
      // For report-only, create a new window with minimal content
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      
      if (dashboardSummaryData && dashboardSummaryData.data && dashboardSummaryData.data.length > 0) {
        let tableHTML = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Budget Dashboard Report</title>
            <style>
              @page {
                size: A4 landscape;
                margin: 0.3in;
              }
              body {
                margin: 0;
                padding: 0;
                font-family: Arial, sans-serif;
                font-size: 12px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 0;
                padding: 0;
              }
              th, td {
                border: 1px solid #000;
                padding: 6px;
                text-align: left;
                font-size: 11px;
              }
              th {
                background-color: #f0f0f0;
                font-weight: bold;
              }
              .title {
                font-size: 18px;
                font-weight: bold;
                color: #f97316;
                margin-bottom: 15px;
              }
            </style>
          </head>
          <body>
            <div class="title">Budget Dashboard Report</div>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Sales Budget</th>
                  <th>Labor Budget</th>
                  <th>Food Cost</th>
                  <th>Fixed Cost</th>
                  <th>Variable Cost</th>
                  <th>Profit/Loss</th>
                </tr>
              </thead>
              <tbody>
        `;
        
        dashboardSummaryData.data.forEach((entry, index) => {
          const date = entry.date || entry.day || entry.month_start || `Day ${index + 1}`;
          const salesBudget = parseFloat(entry.sales_budget) || 0;
          const laborBudget = parseFloat(entry.labour) || 0;
          const foodCost = parseFloat(entry.food_cost) || 0;
          const fixedCost = parseFloat(entry.fixed_cost) || 0;
          const variableCost = parseFloat(entry.variable_cost) || 0;
          const profitLoss = parseFloat(entry.budgeted_profit_loss) || 0;
          
          tableHTML += `
            <tr>
              <td>${date}</td>
              <td style="text-align: right;">$${salesBudget.toFixed(2)}</td>
              <td style="text-align: right;">$${laborBudget.toFixed(2)}</td>
              <td style="text-align: right;">$${foodCost.toFixed(2)}</td>
              <td style="text-align: right;">$${fixedCost.toFixed(2)}</td>
              <td style="text-align: right;">$${variableCost.toFixed(2)}</td>
              <td style="text-align: right; color: ${profitLoss >= 0 ? 'green' : 'red'}; font-weight: bold;">$${profitLoss.toFixed(2)}</td>
            </tr>
          `;
        });
        
        tableHTML += `
              </tbody>
            </table>
          </body>
          </html>
        `;
        
        printWindow.document.write(tableHTML);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }
    } else {
      // For "Report with Charts" option, use the original method
      const printContainer = document.createElement('div');
      printContainer.className = 'print-container';
      printContainer.style.position = 'absolute';
      printContainer.style.left = '-9999px';
      printContainer.style.top = '0';
      
      // Add header information
      const headerDiv = document.createElement('div');
      headerDiv.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px;">
          <h1 style="margin: 0; color: #f97316; font-size: 24px;">Growlio Budget Report</h1>
          <p style="margin: 5px 0; color: #666; font-size: 14px;">Generated on ${new Date().toLocaleDateString()}</p>
        </div>
      `;
      printContainer.appendChild(headerDiv);
      
      // Add the report content (SummaryTableDashboard)
      const reportContent = document.querySelector('.summary-table')?.closest('.ant-card');
      if (reportContent) {
        const clonedContent = reportContent.cloneNode(true);
        const buttons = clonedContent.querySelectorAll('.ant-btn');
        buttons.forEach(btn => btn.remove());
        printContainer.appendChild(clonedContent);
      }
      
      // Add charts if requested - only if they have actual content
      const budgetDashboard = document.querySelector('[class*="space-y-6"]');
      if (budgetDashboard) {
        const clonedCharts = budgetDashboard.cloneNode(true);
        const chartButtons = clonedCharts.querySelectorAll('.ant-btn');
        chartButtons.forEach(btn => btn.remove());
        
        // Remove empty chart containers
        const emptyContainers = clonedCharts.querySelectorAll('.ant-card, .ant-card-body');
        emptyContainers.forEach(container => {
          const hasContent = container.querySelector('canvas, svg, [class*="chart"]') && 
                            container.offsetHeight > 50; // Minimum height check
          if (!hasContent) {
            container.remove();
          }
        });
        
        // Check if charts have actual content (not empty)
        const chartElements = clonedCharts.querySelectorAll('canvas, svg, [class*="chart"]');
        const hasValidCharts = Array.from(chartElements).some(element => {
          // Check if element has content or is not empty
          return element.offsetHeight > 0 && element.offsetWidth > 0;
        });
        
        // Only add charts if they have valid content
        if (hasValidCharts && clonedCharts.children.length > 0) {
          printContainer.appendChild(clonedCharts);
        }
      }
      
      // Add to document temporarily
      document.body.appendChild(printContainer);
      
      // Print
      window.print();
      
      // Clean up
      document.body.removeChild(printContainer);
    }
  },

  // Handle print with options for Profit Loss Dashboard
  handleProfitLossPrint: (printOption, tableData, dashboardData, dashboardSummaryData) => {
    // Debug logging
    console.log('printUtils - Print option:', printOption);
    console.log('printUtils - tableData:', tableData);
    console.log('printUtils - dashboardData:', dashboardData);
    console.log('printUtils - dashboardSummaryData:', dashboardSummaryData);
    
    // Use tableData first, then fallback to other data sources
    const dataToUse = tableData && tableData.length > 0 ? tableData : 
                     (dashboardData && dashboardData.length > 0 ? dashboardData : 
                     (dashboardSummaryData && dashboardSummaryData.data ? dashboardSummaryData.data : null));
    
    console.log('printUtils - dataToUse:', dataToUse);
    console.log('printUtils - dataToUse length:', dataToUse ? dataToUse.length : 'not an array');
    
    if (printOption === 'report-only') {
      // For report-only, create a new window with minimal content
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      
      if (dataToUse && Array.isArray(dataToUse) && dataToUse.length > 0) {
        let tableHTML = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Profit Loss Dashboard Report</title>
            <style>
              @page {
                size: A4 landscape;
                margin: 0.3in;
              }
              body {
                margin: 0;
                padding: 0;
                font-family: Arial, sans-serif;
                font-size: 12px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 0;
                padding: 0;
              }
              th, td {
                border: 1px solid #000;
                padding: 6px;
                text-align: left;
                font-size: 11px;
              }
              th {
                background-color: #f0f0f0;
                font-weight: bold;
              }
              .title {
                font-size: 18px;
                font-weight: bold;
                color: #f97316;
                margin-bottom: 15px;
              }
            </style>
          </head>
          <body>
            <div class="title">Profit Loss Dashboard Report</div>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Sales</th>
                  <th>Labor</th>
                  <th>Food Cost</th>
                  <th>Fixed Cost</th>
                  <th>Variable Cost</th>
                  <th>Profit/Loss</th>
                </tr>
              </thead>
              <tbody>
        `;
        
        dataToUse.forEach((entry, index) => {
          const date = entry.date || entry.day || entry.month_start || entry.week_start || `Day ${index + 1}`;
          const sales = parseFloat(entry.sales || entry.sales_actual || entry.sales_budget || 0);
          const labor = parseFloat(entry.labour || entry.labor_actual || entry.labour_budget || 0);
          const foodCost = parseFloat(entry.food_cost || entry.food_cost_actual || entry.food_cost_budget || 0);
          const fixedCost = parseFloat(entry.fixed_cost || entry.fixed_cost_actual || entry.fixed_cost_budget || 0);
          const variableCost = parseFloat(entry.variable_cost || entry.variable_cost_actual || entry.variable_cost_budget || 0);
          const profitLoss = parseFloat(entry.profit_loss || entry.profit_loss_actual || entry.budgeted_profit_loss || 0);
          
          tableHTML += `
            <tr>
              <td>${date}</td>
              <td style="text-align: right;">$${sales.toFixed(2)}</td>
              <td style="text-align: right;">$${labor.toFixed(2)}</td>
              <td style="text-align: right;">$${foodCost.toFixed(2)}</td>
              <td style="text-align: right;">$${fixedCost.toFixed(2)}</td>
              <td style="text-align: right;">$${variableCost.toFixed(2)}</td>
              <td style="text-align: right; color: ${profitLoss >= 0 ? 'green' : 'red'}; font-weight: bold;">$${profitLoss.toFixed(2)}</td>
            </tr>
          `;
        });
        
        tableHTML += `
              </tbody>
            </table>
          </body>
          </html>
        `;
        
        printWindow.document.write(tableHTML);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }
    } else {
      // For "Report with Charts" option, use the original method
      const printContainer = document.createElement('div');
      printContainer.className = 'print-container';
      printContainer.style.position = 'absolute';
      printContainer.style.left = '-9999px';
      printContainer.style.top = '0';
      
      // Add header information
      const headerDiv = document.createElement('div');
      headerDiv.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px;">
          <h1 style="margin: 0; color: #f97316; font-size: 24px;">Growlio Profit Loss Report</h1>
          <p style="margin: 5px 0; color: #666; font-size: 14px;">Generated on ${new Date().toLocaleDateString()}</p>
        </div>
      `;
      printContainer.appendChild(headerDiv);
      
      // Add the report content (ProfitLossTableDashboard) - Look for the specific table
      const reportContent = document.querySelector('.summary-table')?.closest('.ant-card') || 
                           document.querySelector('[class*="profit-loss"]')?.closest('.ant-card') ||
                           document.querySelector('.ant-card');
      
      if (reportContent) {
        const clonedContent = reportContent.cloneNode(true);
        const buttons = clonedContent.querySelectorAll('.ant-btn');
        buttons.forEach(btn => btn.remove());
        
        // Ensure table is visible in print with enhanced styling
        const tables = clonedContent.querySelectorAll('table');
        tables.forEach(table => {
          // Apply table styling with !important
          table.setAttribute('style', `
            display: table !important;
            width: 100% !important;
            border-collapse: collapse !important;
            border: 3px solid #000 !important;
            border-radius: 8px !important;
            overflow: hidden !important;
            font-size: 12px !important;
            background-color: #ffffff !important;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
            margin: 0 !important;
            padding: 0 !important;
          `);
          
          // Style table headers with !important
          const headers = table.querySelectorAll('th');
          headers.forEach(th => {
            th.setAttribute('style', `
              border: none !important;
              border-bottom: 3px solid #000 !important;
              padding: 12px 10px !important;
              background-color: #e9ecef !important;
              font-weight: bold !important;
              color: #000 !important;
              text-transform: uppercase !important;
              letter-spacing: 0.8px !important;
              font-size: 12px !important;
              vertical-align: middle !important;
              text-align: center !important;
              display: table-cell !important;
            `);
          });
          
          // Style table cells with !important
          const cells = table.querySelectorAll('td');
          cells.forEach((td, index) => {
            const row = td.parentElement;
            const rowIndex = Array.from(row.parentElement.children).indexOf(row);
            
            // Fix data formatting issues
            let cellText = td.textContent || td.innerText || '';
            
            // Fix percentage formatting (remove 0.00- prefix)
            if (cellText.includes('0.00-') && cellText.includes('%')) {
              cellText = cellText.replace('0.00-', '');
            }
            
            // Fix currency formatting
            if (cellText.includes('$') && cellText.includes('-')) {
              cellText = cellText.replace(/-/g, '');
            }
            
            // Update cell content
            td.textContent = cellText;
            
            // Apply styling with !important
            const bgColor = rowIndex % 2 === 0 ? '#ffffff' : '#f8f9fa';
            const isNumber = cellText.includes('$') || !isNaN(parseFloat(cellText.replace(/[$,]/g, '')));
            
            td.setAttribute('style', `
              border: none !important;
              padding: 12px 10px !important;
              font-size: 11px !important;
              vertical-align: middle !important;
              line-height: 1.4 !important;
              font-weight: 500 !important;
              background-color: ${bgColor} !important;
              text-align: ${isNumber ? 'right' : 'left'} !important;
              display: table-cell !important;
              color: #333 !important;
            `);
          });
        });
        
        printContainer.appendChild(clonedContent);
      }
      
      // Always add a fallback table if we have data but no DOM element
      if (dataToUse && Array.isArray(dataToUse) && dataToUse.length > 0) {
        // Check if we already have a table in the container
        const existingTable = printContainer.querySelector('table');
        if (!existingTable) {
          // Fallback: Generate table from data if DOM element not found
          const tableDiv = document.createElement('div');
          tableDiv.className = 'ant-card';
          tableDiv.innerHTML = `
            <div class="ant-card-body" style="padding: 0 !important; background-color: #ffffff !important;">
              <h3 style="color: #f97316; font-size: 18px; font-weight: bold; margin-bottom: 15px; text-align: center; border-bottom: 2px solid #f97316; padding-bottom: 10px;">Profit Loss Dashboard</h3>
              <table style="width: 100% !important; border-collapse: collapse !important; border: 3px solid #000 !important; border-radius: 8px !important; overflow: hidden !important; font-size: 12px !important; background-color: #ffffff !important; box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important; margin: 0 !important; padding: 0 !important;">
                <thead>
                  <tr style="background-color: #e9ecef !important;">
                    <th style="border: none !important; border-bottom: 3px solid #000 !important; padding: 12px 10px !important; background-color: #e9ecef !important; font-weight: bold !important; color: #000 !important; text-transform: uppercase !important; letter-spacing: 0.8px !important; font-size: 12px !important; vertical-align: middle !important; text-align: center !important; display: table-cell !important;">Date</th>
                    <th style="border: none !important; border-bottom: 3px solid #000 !important; padding: 12px 10px !important; background-color: #e9ecef !important; font-weight: bold !important; color: #000 !important; text-transform: uppercase !important; letter-spacing: 0.8px !important; font-size: 12px !important; vertical-align: middle !important; text-align: center !important; display: table-cell !important;">Sales</th>
                    <th style="border: none !important; border-bottom: 3px solid #000 !important; padding: 12px 10px !important; background-color: #e9ecef !important; font-weight: bold !important; color: #000 !important; text-transform: uppercase !important; letter-spacing: 0.8px !important; font-size: 12px !important; vertical-align: middle !important; text-align: center !important; display: table-cell !important;">Labor</th>
                    <th style="border: none !important; border-bottom: 3px solid #000 !important; padding: 12px 10px !important; background-color: #e9ecef !important; font-weight: bold !important; color: #000 !important; text-transform: uppercase !important; letter-spacing: 0.8px !important; font-size: 12px !important; vertical-align: middle !important; text-align: center !important; display: table-cell !important;">Food Cost</th>
                    <th style="border: none !important; border-bottom: 3px solid #000 !important; padding: 12px 10px !important; background-color: #e9ecef !important; font-weight: bold !important; color: #000 !important; text-transform: uppercase !important; letter-spacing: 0.8px !important; font-size: 12px !important; vertical-align: middle !important; text-align: center !important; display: table-cell !important;">Fixed Cost</th>
                    <th style="border: none !important; border-bottom: 3px solid #000 !important; padding: 12px 10px !important; background-color: #e9ecef !important; font-weight: bold !important; color: #000 !important; text-transform: uppercase !important; letter-spacing: 0.8px !important; font-size: 12px !important; vertical-align: middle !important; text-align: center !important; display: table-cell !important;">Variable Cost</th>
                    <th style="border: none !important; border-bottom: 3px solid #000 !important; padding: 12px 10px !important; background-color: #e9ecef !important; font-weight: bold !important; color: #000 !important; text-transform: uppercase !important; letter-spacing: 0.8px !important; font-size: 12px !important; vertical-align: middle !important; text-align: center !important; display: table-cell !important;">Profit/Loss</th>
                  </tr>
                </thead>
                <tbody>
                  ${dataToUse.map((entry, index) => {
                    const date = entry.date || entry.day || entry.month_start || entry.week_start || 'N/A';
                    const sales = parseFloat(entry.sales || entry.sales_actual || entry.sales_budget || 0);
                    const labor = parseFloat(entry.labour || entry.labor_actual || entry.labour_budget || 0);
                    const foodCost = parseFloat(entry.food_cost || entry.food_cost_actual || entry.food_cost_budget || 0);
                    const fixedCost = parseFloat(entry.fixed_cost || entry.fixed_cost_actual || entry.fixed_cost_budget || 0);
                    const variableCost = parseFloat(entry.variable_cost || entry.variable_cost_actual || entry.variable_cost_budget || 0);
                    const profitLoss = parseFloat(entry.profit_loss || entry.profit_loss_actual || entry.budgeted_profit_loss || 0);
                    
                    const rowBgColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
                    
                    return `
                      <tr style="background-color: ${rowBgColor} !important;">
                        <td style="border: none !important; padding: 12px 10px !important; font-size: 11px !important; vertical-align: middle !important; line-height: 1.4 !important; font-weight: 500 !important; background-color: ${rowBgColor} !important; text-align: left !important; display: table-cell !important; color: #333 !important;">${date}</td>
                        <td style="border: none !important; padding: 12px 10px !important; text-align: right !important; font-size: 11px !important; vertical-align: middle !important; line-height: 1.4 !important; font-weight: 600 !important; background-color: ${rowBgColor} !important; display: table-cell !important; color: #333 !important;">$${sales.toFixed(2)}</td>
                        <td style="border: none !important; padding: 12px 10px !important; text-align: right !important; font-size: 11px !important; vertical-align: middle !important; line-height: 1.4 !important; font-weight: 600 !important; background-color: ${rowBgColor} !important; display: table-cell !important; color: #333 !important;">$${labor.toFixed(2)}</td>
                        <td style="border: none !important; padding: 12px 10px !important; text-align: right !important; font-size: 11px !important; vertical-align: middle !important; line-height: 1.4 !important; font-weight: 600 !important; background-color: ${rowBgColor} !important; display: table-cell !important; color: #333 !important;">$${foodCost.toFixed(2)}</td>
                        <td style="border: none !important; padding: 12px 10px !important; text-align: right !important; font-size: 11px !important; vertical-align: middle !important; line-height: 1.4 !important; font-weight: 600 !important; background-color: ${rowBgColor} !important; display: table-cell !important; color: #333 !important;">$${fixedCost.toFixed(2)}</td>
                        <td style="border: none !important; padding: 12px 10px !important; text-align: right !important; font-size: 11px !important; vertical-align: middle !important; line-height: 1.4 !important; font-weight: 600 !important; background-color: ${rowBgColor} !important; display: table-cell !important; color: #333 !important;">$${variableCost.toFixed(2)}</td>
                        <td style="border: none !important; padding: 12px 10px !important; text-align: right !important; font-size: 11px !important; vertical-align: middle !important; line-height: 1.4 !important; font-weight: bold !important; color: ${profitLoss >= 0 ? '#28a745' : '#dc3545'} !important; background-color: ${profitLoss >= 0 ? '#d4edda' : '#f8d7da'} !important; display: table-cell !important;">$${profitLoss.toFixed(2)}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `;
          printContainer.appendChild(tableDiv);
        }
      }
      
      // Add charts if requested - only if they have actual content
      const budgetDashboard = document.querySelector('[class*="space-y-6"]');
      if (budgetDashboard) {
        const clonedCharts = budgetDashboard.cloneNode(true);
        const chartButtons = clonedCharts.querySelectorAll('.ant-btn');
        chartButtons.forEach(btn => btn.remove());
        
        // Remove empty chart containers
        const emptyContainers = clonedCharts.querySelectorAll('.ant-card, .ant-card-body');
        emptyContainers.forEach(container => {
          const hasContent = container.querySelector('canvas, svg, [class*="chart"]') && 
                            container.offsetHeight > 50; // Minimum height check
          if (!hasContent) {
            container.remove();
          }
        });
        
        // Check if charts have actual content (not empty)
        const chartElements = clonedCharts.querySelectorAll('canvas, svg, [class*="chart"]');
        const hasValidCharts = Array.from(chartElements).some(element => {
          // Check if element has content or is not empty
          return element.offsetHeight > 0 && element.offsetWidth > 0;
        });
        
        // Only add charts if they have valid content
        if (hasValidCharts && clonedCharts.children.length > 0) {
          printContainer.appendChild(clonedCharts);
        }
      }
      
      // Add comprehensive CSS for print layout
      const style = document.createElement('style');
      style.textContent = `
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          .print-container {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            position: relative !important;
            top: 0 !important;
            left: 0 !important;
            height: auto !important;
            overflow: visible !important;
            page-break-inside: avoid !important;
          }
          
          .print-container .ant-card {
            display: block !important;
            width: 100% !important;
            margin: 0 0 20px 0 !important;
            padding: 20px !important;
            border: 3px solid #000 !important;
            border-radius: 12px !important;
            page-break-inside: avoid !important;
            background-color: #ffffff !important;
            box-shadow: 0 4px 8px rgba(0,0,0,0.15) !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          .print-container .ant-card-body {
            padding: 0 !important;
            background-color: #ffffff !important;
          }
          
          .print-container .ant-card:first-child {
            width: 100% !important;
            margin-bottom: 20px !important;
          }
          
          .print-container table {
            display: table !important;
            width: 100% !important;
            border-collapse: collapse !important;
            margin: 0 !important;
            padding: 0 !important;
            font-size: 12px !important;
            border: 3px solid #000 !important;
            border-radius: 8px !important;
            overflow: hidden !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            background-color: #ffffff !important;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
          }
          
          .print-container table th,
          .print-container table td {
            border: 2px solid #000 !important;
            padding: 12px 10px !important;
            text-align: left !important;
            font-size: 11px !important;
            display: table-cell !important;
            vertical-align: middle !important;
            line-height: 1.4 !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            font-weight: 500 !important;
          }
          
          .print-container table th {
            background-color: #e9ecef !important;
            font-weight: bold !important;
            color: #000 !important;
            text-transform: uppercase !important;
            letter-spacing: 0.8px !important;
            border-bottom: 3px solid #000 !important;
            font-size: 12px !important;
            text-align: center !important;
          }
          
          .print-container table td {
            background-color: #ffffff !important;
            color: #333 !important;
          }
          
          .print-container table tbody tr:nth-child(even) td {
            background-color: #f8f9fa !important;
          }
          
          .print-container table tbody tr:nth-child(odd) td {
            background-color: #ffffff !important;
          }
          
          .print-container table tbody tr:hover td {
            background-color: #e3f2fd !important;
          }
          
          .print-container .ant-table {
            display: table !important;
            width: 100% !important;
          }
          
          .print-container .ant-table-tbody {
            display: table-row-group !important;
          }
          
          .print-container .ant-table-tbody > tr {
            display: table-row !important;
          }
          
          .print-container .ant-table-tbody > tr > td {
            display: table-cell !important;
            border: 1px solid #333 !important;
            padding: 8px 6px !important;
            font-size: 10px !important;
            vertical-align: middle !important;
            line-height: 1.3 !important;
          }
          
          .print-container .ant-table-thead {
            display: table-header-group !important;
          }
          
          .print-container .ant-table-thead > tr {
            display: table-row !important;
          }
          
          .print-container .ant-table-thead > tr > th {
            display: table-cell !important;
            border: 1px solid #333 !important;
            padding: 8px 6px !important;
            background-color: #f8f9fa !important;
            font-weight: bold !important;
            color: #000 !important;
            text-transform: uppercase !important;
            letter-spacing: 0.5px !important;
            border-bottom: 2px solid #000 !important;
            font-size: 10px !important;
            vertical-align: middle !important;
          }
          
          .print-container .ant-table-container {
            display: block !important;
            width: 100% !important;
            overflow: visible !important;
          }
          
          .print-container .ant-table-content {
            display: table !important;
            width: 100% !important;
          }
          
          .print-container .ant-table-scroll {
            display: block !important;
            overflow: visible !important;
          }
          
          .print-container .ant-table-body {
            display: table-row-group !important;
          }
          
          .print-container .ant-table-row {
            display: table-row !important;
          }
          
          .print-container .ant-table-cell {
            display: table-cell !important;
            border: 1px solid #000 !important;
            padding: 4px !important;
          }
          
          .print-container .ant-table-thead .ant-table-cell {
            background-color: #f0f0f0 !important;
            font-weight: bold !important;
          }
          
          .print-container .ant-table-tbody .ant-table-cell {
            background-color: transparent !important;
          }
          
          .print-container .ant-table-tbody .ant-table-row:nth-child(even) .ant-table-cell {
            background-color: #f9f9f9 !important;
          }
          
          .print-container .ant-table-tbody .ant-table-row:nth-child(odd) .ant-table-cell {
            background-color: #ffffff !important;
          }
          
          .print-container table tbody tr:nth-child(even) td {
            background-color: #f8f9fa !important;
          }
          
          .print-container table tbody tr:nth-child(odd) td {
            background-color: #ffffff !important;
          }
        }
      `;
      printContainer.appendChild(style);
      
      // Add to document temporarily
      document.body.appendChild(printContainer);
      
      // Print
      window.print();
      
      // Clean up
      document.body.removeChild(printContainer);
    }
  }
};
