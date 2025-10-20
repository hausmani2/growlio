import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Typography, Alert, Divider, Tag } from 'antd';
import { 
  isImpersonating, 
  getImpersonatedUser, 
  getImpersonatedUserData, 
  getImpersonationMessage,
  getCurrentTokenType,
  debugTokenState,
  forceStoreOriginalToken
} from '../../utils/tokenManager';
import useStore from '../../store/store';

const { Title, Text, Paragraph } = Typography;

/**
 * Token State Debugger Component
 * 
 * This component shows the current token state and helps debug token management issues.
 * Add this to your super admin dashboard to see what's happening with tokens.
 */
const TokenStateDebugger = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const { user } = useStore();

  const refreshData = () => {
    setRefreshKey(prev => prev + 1);
  };

  const currentTokenType = getCurrentTokenType();
  const isCurrentlyImpersonating = isImpersonating();
  const impersonatedUser = getImpersonatedUser();
  const impersonatedUserData = getImpersonatedUserData();
  const impersonationMessage = getImpersonationMessage();

  // Get all localStorage data
  const localStorageData = {
    mainToken: localStorage.getItem('token'),
    originalSuperadminToken: localStorage.getItem('original_superadmin_token'),
    originalSuperadminRefresh: localStorage.getItem('original_superadmin_refresh'),
    originalSuperadmin: localStorage.getItem('original_superadmin'),
    originalRestaurantId: localStorage.getItem('original_restaurant_id'),
    impersonatedUser: localStorage.getItem('impersonated_user'),
    impersonatedUserData: localStorage.getItem('impersonated_user_data'),
    impersonationAccessToken: localStorage.getItem('impersonation_access_token'),
    impersonationRefreshToken: localStorage.getItem('impersonation_refresh_token'),
    impersonationMessage: localStorage.getItem('impersonation_message'),
    restaurantId: localStorage.getItem('restaurant_id')
  };

  const handleDebugTokens = () => {
    debugTokenState();
  };

  const handleClearAllTokens = () => {
    if (window.confirm('Are you sure you want to clear all tokens? This will log you out.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleFixMissingToken = () => {
    const mainToken = localStorage.getItem('token');
    if (mainToken) {
      // Create a user object with the current token
      const userWithToken = {
        ...user,
        access: mainToken,
        refresh: localStorage.getItem('refresh_token') || mainToken
      };
      forceStoreOriginalToken(userWithToken);
      refreshData();
      alert('Original super admin token has been restored from main token!');
    } else {
      alert('No token available to restore');
    }
  };

  const handleRestoreFromMainToken = () => {
    const mainToken = localStorage.getItem('token');
    if (mainToken) {
      // Store the main token as the original super admin token
      localStorage.setItem('original_superadmin_token', mainToken);
      localStorage.setItem('original_superadmin_refresh', localStorage.getItem('refresh_token') || mainToken);
      refreshData();
      alert('Original super admin token restored from current main token!');
    } else {
      alert('No main token available');
    }
  };

  const handleTestStopImpersonation = () => {
    if (isCurrentlyImpersonating) {
      const { stopImpersonation } = useStore.getState();
      stopImpersonation();
    } else {
      alert('Not currently impersonating');
    }
  };

  return (
    <Card 
      title="🔍 Token State Debugger" 
      size="small"
      style={{ margin: '16px 0' }}
      extra={
        <Space>
          <Button size="small" onClick={refreshData}>Refresh</Button>
          <Button size="small" onClick={handleDebugTokens}>Debug Console</Button>
        </Space>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        {/* Current Status */}
        <Alert
          message={`Current Status: ${isCurrentlyImpersonating ? 'IMPERSONATING' : 'SUPER ADMIN'}`}
          type={isCurrentlyImpersonating ? 'warning' : 'success'}
          showIcon
        />
        
        {/* User Data Status */}
        {user && (
          <Alert
            message={`User Data: ${user.email} (${user.access ? 'Has Token' : 'No Token'})`}
            type={user.access ? 'success' : 'error'}
            showIcon
          />
        )}
        
        <Divider />
        
        {/* Token Type */}
        <div>
          <Title level={5}>Token Information</Title>
          <Paragraph>
            <Text strong>Current Token Type:</Text> <Tag color={currentTokenType === 'superadmin' ? 'green' : currentTokenType === 'impersonation' ? 'orange' : 'blue'}>{currentTokenType.toUpperCase()}</Tag>
          </Paragraph>
          
          {isCurrentlyImpersonating && (
            <>
              <Paragraph>
                <Text strong>Impersonating:</Text> {impersonatedUser}
              </Paragraph>
              
              {impersonationMessage && (
                <Paragraph>
                  <Text strong>Message:</Text> {impersonationMessage}
                </Paragraph>
              )}
            </>
          )}
        </div>
        
        <Divider />
        
        {/* Local Storage Keys */}
        <div>
          <Title level={5}>Local Storage Status</Title>
          {Object.entries(localStorageData).map(([key, value]) => (
            <Paragraph key={key} style={{ margin: '4px 0' }}>
              <Text strong>{key}:</Text> {value ? (
                <Tag color="green">Present ({value.length} chars)</Tag>
              ) : (
                <Tag color="red">Missing</Tag>
              )}
            </Paragraph>
          ))}
        </div>
        
        <Divider />
        
        {/* Actions */}
        <Space>
          <Button 
            type="primary" 
            onClick={handleDebugTokens}
          >
            Debug Console
          </Button>
          {!localStorageData.originalSuperadminToken && localStorageData.mainToken && (
            <Button 
              type="default"
              onClick={handleFixMissingToken}
            >
              Fix Missing Token
            </Button>
          )}
          {!localStorageData.originalSuperadminToken && localStorageData.mainToken && (
            <Button 
              type="default"
              onClick={handleRestoreFromMainToken}
            >
              Restore from Main Token
            </Button>
          )}
          {isCurrentlyImpersonating && (
            <Button 
              type="default"
              onClick={handleTestStopImpersonation}
            >
              Test Stop Impersonation
            </Button>
          )}
          <Button 
            danger
            onClick={handleClearAllTokens}
          >
            Clear All Tokens
          </Button>
        </Space>
      </Space>
    </Card>
  );
};

export default TokenStateDebugger;
