import React from 'react';
import { Card, Button, Space, Typography, Alert, Divider } from 'antd';
import { 
  isImpersonating, 
  getImpersonatedUser, 
  getImpersonatedUserData, 
  getImpersonationMessage,
  getCurrentTokenType,
  debugTokenState
} from '../../utils/tokenManager';

const { Title, Text, Paragraph } = Typography;

/**
 * Token Debugger Component
 * 
 * This component helps debug token management issues in the super admin system.
 * It shows the current token state and provides debugging information.
 * 
 * Usage: Add this component to your super admin dashboard for debugging
 */
const TokenDebugger = () => {
  const handleDebugTokens = () => {
    debugTokenState();
  };

  const currentTokenType = getCurrentTokenType();
  const isCurrentlyImpersonating = isImpersonating();
  const impersonatedUser = getImpersonatedUser();
  const impersonatedUserData = getImpersonatedUserData();
  const impersonationMessage = getImpersonationMessage();

  return (
    <Card 
      title="Token Management Debugger" 
      size="small"
      style={{ margin: '16px 0' }}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <Alert
          message={`Current Token Type: ${currentTokenType.toUpperCase()}`}
          type={currentTokenType === 'superadmin' ? 'success' : 
                currentTokenType === 'impersonation' ? 'warning' : 'info'}
          showIcon
        />
        
        <Divider />
        
        <div>
          <Title level={5}>Impersonation Status</Title>
          <Paragraph>
            <Text strong>Is Impersonating:</Text> {isCurrentlyImpersonating ? 'Yes' : 'No'}
          </Paragraph>
          
          {isCurrentlyImpersonating && (
            <>
              <Paragraph>
                <Text strong>Impersonated User:</Text> {impersonatedUser}
              </Paragraph>
              
              {impersonatedUserData && (
                <Paragraph>
                  <Text strong>User Data:</Text> {JSON.stringify(impersonatedUserData, null, 2)}
                </Paragraph>
              )}
              
              {impersonationMessage && (
                <Paragraph>
                  <Text strong>Message:</Text> {impersonationMessage}
                </Paragraph>
              )}
            </>
          )}
        </div>
        
        <Divider />
        
        <div>
          <Title level={5}>Local Storage Keys</Title>
          <Paragraph>
            <Text strong>Main Token:</Text> {localStorage.getItem('token') ? 'Present' : 'Missing'}
          </Paragraph>
          <Paragraph>
            <Text strong>Original Super Admin Token:</Text> {localStorage.getItem('original_superadmin_token') ? 'Present' : 'Missing'}
          </Paragraph>
          <Paragraph>
            <Text strong>Impersonation Token:</Text> {localStorage.getItem('impersonation_access_token') ? 'Present' : 'Missing'}
          </Paragraph>
          <Paragraph>
            <Text strong>Impersonated User:</Text> {localStorage.getItem('impersonated_user') ? 'Present' : 'Missing'}
          </Paragraph>
        </div>
        
        <Divider />
        
        <Button 
          type="primary" 
          onClick={handleDebugTokens}
          style={{ width: '100%' }}
        >
          Debug Token State (Check Console)
        </Button>
      </Space>
    </Card>
  );
};

export default TokenDebugger;
