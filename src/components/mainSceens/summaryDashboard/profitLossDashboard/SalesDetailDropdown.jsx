import React, { useState } from 'react';
import { Popover, Typography } from 'antd';
import { DollarOutlined, ShoppingOutlined, MobileOutlined, CarOutlined, PlusOutlined, MinusOutlined } from '@ant-design/icons';

const { Text } = Typography;

const SalesDetailDropdown = ({ 
  children, 
  dayData, 
  salesData 
}) => {
  const [expandedSections, setExpandedSections] = useState({
    salesActual: false,
    inStore: false,
    thirdParty: false
  });

  if (!dayData || !salesData) {
    return children;
  }

  
  // Note: sales_actual comes directly from API response, not calculated
  // Only fixed_costs and variable_costs arrays should be summed

  // Calculate values - handle different possible field names
  const salesBudget = parseFloat(salesData.sales_budget) || 0;
  
  // Get sales_actual directly from API response (not calculated)
  const salesActual = parseFloat(salesData.sales_actual) || 0;
  const appOnlineSales = parseFloat(salesData.app_online_sales) || 0;
  
  // Handle third party sales from new structure - array format
  const thirdPartyProviders = [];
  
  if (salesData.third_party_sales && Array.isArray(salesData.third_party_sales)) {
    // Process array of third party providers
    salesData.third_party_sales.forEach((provider, index) => {
      if (provider.provider_name && provider.provider_fee) {
        const providerFee = parseFloat(provider.provider_fee) || 0;
        if (providerFee > 0) {
          thirdPartyProviders.push({
            name: provider.provider_name,
            key: `provider_${index}`,
            sales: providerFee
          });
        }
      }
    });
  }

  // Individual third party providers (if they exist in the response)
  // Only Door Dash is currently supported
  
  // Use sales_actual directly from API (not calculated)
  const totalActualSales = salesActual;
  const tickets = parseFloat(salesData.tickets) || 0;
  const avgTicket = parseFloat(salesData.average_ticket) || (tickets > 0 ? totalActualSales / tickets : 0);
  
  // Get over/under values directly from API response
  const amtOverUnder = parseFloat(salesData.sales_amount) || 0;
  const percentOverUnder = parseFloat(salesData.sales_amount_percent) || 0;

  // Get color for over/under values
  const getOverUnderColor = (value) => {
    if (value > 0) return '!text-red-600';
    if (value < 0) return '!text-green-600';
    return '!text-red-600';
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Format percentage - API provides the value, format to 1 decimal place
  const formatPercentage = (value) => {
    return `${value > 0 ? '+' : ''}${parseFloat(value).toFixed(1)}%`;
  };

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const dropdownContent = (
    <div className="w-72 p-4 bg-white rounded-lg shadow-xl border border-gray-200">
      <div className="space-y-3">
        {/* Header */}
        <div className="text-center pb-2 border-b border-gray-200">
          <Text strong className="text-sm text-gray-700">
            {dayData.dayName} ({dayData.date})
          </Text>
        </div>

        {/* Sales Budget */}
        <div className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
          <div className="flex items-center gap-2">
            <DollarOutlined className="text-blue-600 text-sm" />
            <Text className="text-sm font-semibold text-blue-800">Sales Budget:</Text>
          </div>
          <Text strong className="text-sm text-blue-900">{formatCurrency(salesBudget)}</Text>
        </div>

        {/* Sales Actual - Expandable */}
        <div className="border border-gray-200 rounded">
          <div 
            className="flex items-center justify-between p-2 bg-green-50 cursor-pointer hover:bg-green-100"
            onClick={() => toggleSection('salesActual')}
          >
            <div className="flex items-center gap-2">
              <ShoppingOutlined className="text-green-600 text-sm" />
              <Text className="text-sm font-semibold text-green-800">Net Sales</Text>
            </div>
            <div className="flex items-center gap-2">
              <Text strong className="text-sm text-green-900">{formatCurrency(totalActualSales)}</Text>
              {expandedSections.salesActual ? (
                <MinusOutlined className="text-green-600 text-xs" />
              ) : (
                <PlusOutlined className="text-green-600 text-xs" />
              )}
            </div>
          </div>
          
          {/* Expanded Sales Actual Content */}
          {expandedSections.salesActual && (
            <div className="p-2 bg-white border-t border-gray-200 space-y-2">
              {/* In-Store Sales - Expandable */}
              <div className="border border-gray-200 rounded">
                <div 
                  className="flex items-center justify-between p-2 bg-gray-50 cursor-pointer hover:bg-gray-100"
                  onClick={() => toggleSection('inStore')}
                >
                  <div className="flex items-center gap-2">
                    <ShoppingOutlined className="text-gray-600 text-xs" />
                    <Text className="text-xs font-medium text-gray-700">In-Store Sales:</Text>
                  </div>
                  <div className="flex items-center gap-2">
                    <Text className="text-xs font-semibold">{formatCurrency(parseFloat(salesData?.in_store_sales || salesData?.['in-store_sales']) || 0)}</Text>
                    {expandedSections.inStore ? (
                      <MinusOutlined className="text-gray-600 text-xs" />
                    ) : (
                      <PlusOutlined className="text-gray-600 text-xs" />
                    )}
                  </div>
                </div>
                
                {/* Expanded In-Store Content */}
                {expandedSections.inStore && (
                  <div className="p-2 bg-white border-t border-gray-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <Text className="text-xs text-gray-600"># Tickets:</Text>
                      <Text className="text-xs font-semibold">{tickets}</Text>
                    </div>
                    <div className="flex items-center justify-between">
                      <Text className="text-xs text-gray-600">AVG Ticket:</Text>
                      <Text className="text-xs font-semibold">{formatCurrency(avgTicket)}</Text>
                    </div>
                  </div>
                )}
              </div>

              {/* App/Online Sales - Single Level (No Expandable) */}
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                <div className="flex items-center gap-2">
                  <MobileOutlined className="text-gray-600 text-xs" />
                  <Text className="text-xs font-medium text-gray-700">App/Online Sales:</Text>
                </div>
                <Text className="text-xs font-semibold">{formatCurrency(appOnlineSales)}</Text>
              </div>

                                            {/* Third Party Sales - Multi-level Expandable */}
                {thirdPartyProviders.length > 0 && (
                  <div className="border border-gray-200 rounded">
                    <div 
                      className="flex items-center justify-between p-2 bg-gray-50 cursor-pointer hover:bg-gray-100"
                      onClick={() => toggleSection('thirdParty')}
                    >
                      <div className="flex items-center gap-2">
                        <CarOutlined className="text-gray-600 text-xs" />
                        <Text className="text-xs font-medium text-gray-700">Third Party Sales:</Text>
                      </div>
                                             <div className="flex items-center gap-2">
                         <Text className="text-xs font-semibold">
                           {thirdPartyProviders.reduce((total, provider) => total + provider.sales, 0)}%
                         </Text>
                        {expandedSections.thirdParty ? (
                          <MinusOutlined className="text-gray-600 text-xs" />
                        ) : (
                          <PlusOutlined className="text-gray-600 text-xs" />
                        )}
                      </div>
                    </div>
                    
                    {/* Expanded Third Party Content */}
                    {expandedSections.thirdParty && (
                      <div className="p-2 bg-white border-t border-gray-200 space-y-2">
                        {/* Dynamic Provider List */}
                        {thirdPartyProviders.map((provider) => (
                          <div key={provider.key} className="border border-gray-200 rounded">
                            <div 
                              className="flex items-center justify-between p-2 bg-gray-50 cursor-pointer hover:bg-gray-100"
                              onClick={() => toggleSection(provider.key)}
                            >
                              <div className="flex items-center gap-2">
                                <CarOutlined className="text-gray-500 text-xs" />
                                <Text className="text-xs font-medium text-gray-600">{provider.name}:</Text>
                              </div>
                                                             <div className="flex items-center gap-2">
                                 <Text className="text-xs font-semibold">{provider.sales}%</Text>
                               </div>
                            </div>
                            

                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                                            {/* Show message if no detailed sales data available */}
                {salesActual === 0 && appOnlineSales === 0 && thirdPartyProviders.length === 0 && (
                  <div className="text-center py-2 bg-gray-50 rounded border border-gray-200">
                    <Text className="text-xs text-gray-500 italic">
                      No detailed sales data available
                    </Text>
                  </div>
                )}
            </div>
          )}
        </div>

        {/* Over/Under Analysis */}
        <div className="p-2 bg-orange-50 rounded border border-orange-200">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Text className="text-xs font-semibold text-gray-700">Amt Over/Under:</Text>
              <Text className={`text-xs font-bold ${getOverUnderColor(amtOverUnder)}`}>
                {formatCurrency(amtOverUnder)}
              </Text>
            </div>
            <div className="flex items-center justify-between">
              <Text className="text-xs font-semibold text-gray-700">% Over/Under:</Text>
              <Text className={`text-xs font-bold ${getOverUnderColor(percentOverUnder)}`}>
                {formatPercentage(percentOverUnder)}
              </Text>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Popover
      content={dropdownContent}
      title={null}
      trigger="click"
      placement="bottomLeft"
      overlayClassName="sales-detail-popover"
      destroyTooltipOnHide
      overlayStyle={{
        zIndex: 1000,
      }}
    >
      {children}
    </Popover>
  );
};

export default SalesDetailDropdown;
