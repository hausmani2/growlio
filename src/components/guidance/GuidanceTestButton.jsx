import React, { useState } from 'react';
import { Button, Space, Card } from 'antd';
import { useGuidance } from '../../contexts/GuidanceContext';
import { apiGet, apiPost } from '../../utils/axiosInterceptors';

/**
 * Test button component to manually reset guidance status and trigger guidance
 * This is for development/testing purposes only
 */
const GuidanceTestButton = () => {
  const { 
    startGuidance, 
    startDataGuidance,
    isActive, 
    isDataGuidanceActive,
    loading, 
    hasSeenGuidance,
    hasSeenDataGuidance,
    popups, 
    dataGuidancePopups,
    currentPage 
  } = useGuidance();
  const [forceShow, setForceShow] = useState(false);

  const handleResetGuidance = async () => {
    try {
      console.log('🔄 Forcing guidance to show...');
      setForceShow(true);
      
      // Force start guidance by bypassing the hasSeenGuidance check
      // We'll manually set the state and trigger
      await startGuidance();
    } catch (error) {
      console.error('Failed to reset guidance:', error);
    }
  };

  const handleCheckStatus = async () => {
    try {
      const response = await apiGet('/authentication/user/guidance-status/');
      console.log('📊 Current guidance status:', response.data);
      alert(`Guidance Status: ${JSON.stringify(response.data, null, 2)}`);
    } catch (error) {
      // Handle 401 errors gracefully
      if (error.response?.status === 401) {
        alert('Not authenticated. Please log in first.');
        console.warn('User is not authenticated');
        return;
      }
      console.error('Failed to check status:', error);
      alert('Failed to check status. Check console for details.');
    }
  };

  const handleForceShow = async () => {
    try {
      console.log('🔄 Force showing guidance...');
      setForceShow(true);
      
      // Force start guidance with forceShow flag
      await startGuidance(true);
    } catch (error) {
      console.error('Failed to force show:', error);
    }
  };

  const handleForceShowDataGuidance = async () => {
    try {
      console.log('🔄 Force showing data guidance...');
      await startDataGuidance(true);
    } catch (error) {
      console.error('Failed to force show data guidance:', error);
    }
  };

  const handleCheckPopups = async () => {
    try {
      const response = await apiGet('/admin_access/guidance-popups/');
      const allPopups = response.data || [];
      const dataGuidanceKeys = [
        'close-your-days',
        'add-actual-weekly-sales',
        'actual-weekly-sales-table',
        'actual-weekly-sales-totals',
        'actual-weekly-cogs-performance',
        'actual-weekly-cogs-totals',
        'actual-weekly-labor-performance',
        'actual-weekly-labor-totals'
      ];
      const dataPopups = allPopups.filter(p => 
        dataGuidanceKeys.includes(p.key) && p.page === currentPage
      );
      console.log('📊 All popups:', allPopups);
      console.log('📊 Data guidance popups for current page:', dataPopups);
      alert(`Total Popups: ${allPopups.length}\nData Guidance Popups for "${currentPage}": ${dataPopups.length}\n\nCheck console for details.`);
    } catch (error) {
      console.error('Failed to check popups:', error);
      alert('Failed to check popups. Check console for details.');
    }
  };

  // Always show the test button for debugging
  return (
    <div className="fixed bottom-4 right-4 z-[10001] flex flex-col gap-2 bg-white p-3 rounded-lg shadow-lg border-2 border-orange-300">
      <div className="text-xs font-bold text-orange-600 mb-2">🎯 Guidance Debug</div>
      <Space direction="vertical" size="small" className="w-full">
        <Button
          type="primary"
          onClick={handleForceShow}
          disabled={loading}
          className="bg-orange-500 hover:bg-orange-600 w-full font-semibold"
          size="small"
        >
          {loading ? 'Loading...' : '🚀 Force Show'}
        </Button>
        <Button
          onClick={handleCheckStatus}
          size="small"
          className="w-full"
        >
          📊 Check Status
        </Button>
        <Button
          onClick={handleForceShowDataGuidance}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 w-full font-semibold text-white"
          size="small"
        >
          🎯 Force Data Guidance
        </Button>
        <Button
          onClick={handleCheckPopups}
          size="small"
          className="w-full"
        >
          🔍 Check Popups
        </Button>
        <div className="text-xs text-gray-600 space-y-1 pt-2 border-t border-gray-200">
          <div className="flex justify-between">
            <span>Active:</span>
            <span className={isActive ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
              {isActive ? '✅ Yes' : '❌ No'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Data Active:</span>
            <span className={isDataGuidanceActive ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
              {isDataGuidanceActive ? '✅ Yes' : '❌ No'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Loading:</span>
            <span className={loading ? 'text-yellow-600' : 'text-gray-600'}>
              {loading ? '⏳ Yes' : '✓ No'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Seen:</span>
            <span className={hasSeenGuidance ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>
              {hasSeenGuidance ? '✅ Yes' : '❌ No'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Data Seen:</span>
            <span className={hasSeenDataGuidance ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>
              {hasSeenDataGuidance ? '✅ Yes' : '❌ No'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Page:</span>
            <span className="text-blue-600 font-mono text-xs">{currentPage || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span>Popups:</span>
            <span className="text-blue-600 font-bold">{popups.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Data Popups:</span>
            <span className="text-blue-600 font-bold">{dataGuidancePopups.length}</span>
          </div>
        </div>
      </Space>
    </div>
  );
};

export default GuidanceTestButton;

