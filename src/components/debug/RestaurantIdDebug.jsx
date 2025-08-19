import React, { useState } from 'react';
import { Button, Card, Typography, Space, Alert } from 'antd';
import useStore from '../../store/store';

const { Title, Text } = Typography;

const RestaurantIdDebug = () => {
  const [debugInfo, setDebugInfo] = useState(null);
  
  const {
    debugRestaurantId,
    setRestaurantIdAndPersist,
    checkOnboardingCompletion
  } = useStore();

  const runDebug = () => {
    console.log('🔍 Running restaurant ID debug...');
    const info = debugRestaurantId();
    setDebugInfo(info);
    console.log('Debug info:', info);
  };

  const testOnboardingCheck = async () => {
    try {
      console.log('🔄 Testing onboarding completion check...');
      const result = await checkOnboardingCompletion();
      console.log('Onboarding check result:', result);
      alert(`Onboarding check result: ${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      console.error('Onboarding check error:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const clearRestaurantId = () => {
    localStorage.removeItem('restaurant_id');
    console.log('🗑️ Cleared restaurant_id from localStorage');
    runDebug();
  };

  const setTestRestaurantId = () => {
    const testId = prompt('Enter test restaurant ID:');
    if (testId) {
      setRestaurantIdAndPersist(testId);
      runDebug();
    }
  };

  return (
    <Card title="Restaurant ID Debug Tool" style={{ margin: '20px' }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Button type="primary" onClick={runDebug}>
          Run Debug
        </Button>
        
        <Button onClick={testOnboardingCheck}>
          Test Onboarding Check
        </Button>
        
        <Button onClick={setTestRestaurantId}>
          Set Test Restaurant ID
        </Button>
        
        <Button danger onClick={clearRestaurantId}>
          Clear Restaurant ID
        </Button>

        {debugInfo && (
          <Card title="Debug Results" size="small">
            <Space direction="vertical">
              <Text>Store restaurantId: <strong>{debugInfo.storeRestaurantId || 'null'}</strong></Text>
              <Text>localStorage restaurant_id: <strong>{debugInfo.localRestaurantId || 'null'}</strong></Text>
              <Text>Onboarding data restaurant_id: <strong>{debugInfo.onboardingRestaurantId || 'null'}</strong></Text>
              <Text>Has store ID: <strong>{debugInfo.hasStoreId ? 'Yes' : 'No'}</strong></Text>
              <Text>Has local ID: <strong>{debugInfo.hasLocalId ? 'Yes' : 'No'}</strong></Text>
            </Space>
          </Card>
        )}

        <Alert
          message="Debug Information"
          description="This tool helps debug restaurant ID issues. Use the buttons above to test different scenarios."
          type="info"
          showIcon
        />
      </Space>
    </Card>
  );
};

export default RestaurantIdDebug;
