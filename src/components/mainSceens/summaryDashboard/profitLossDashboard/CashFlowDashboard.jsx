import React from 'react';
import CashFlowModule from './CashFlowModule';

/**
 * Standalone Cash Flow dashboard page (same module as before on P&L).
 */
const CashFlowDashboard = () => (
  <div className="w-full">
    <div className="w-full mx-auto space-y-4">
      <CashFlowModule />
    </div>
  </div>
);

export default CashFlowDashboard;
