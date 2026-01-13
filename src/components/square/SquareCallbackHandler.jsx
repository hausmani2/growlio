import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Spin, Result, Button } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import useStore from '../../store/store';

/**
 * Square Callback Handler Component
 * Handles the OAuth callback from Square after user authorization
 */
const SquareCallbackHandler = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [processing, setProcessing] = useState(true);
  const [result, setResult] = useState(null); // 'success' | 'error' | null
  
  const handleSquareCallback = useStore((state) => state.handleSquareCallback);
  const squareError = useStore((state) => state.squareError);
  
  useEffect(() => {
    const processCallback = async () => {
      try {
        // Extract authorization code and state from URL
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        
        // Handle OAuth error from Square
        if (error) {
          console.error('Square OAuth error:', error, errorDescription);
          setResult('error');
          setProcessing(false);
          return;
        }
        
        // Check if we have an authorization code
        if (!code) {
          console.error('No authorization code received from Square');
          setResult('error');
          setProcessing(false);
          return;
        }
        
        // Process the callback
        const response = await handleSquareCallback(code, state);
        
        if (response.success) {
          setResult('success');
        } else {
          setResult('error');
        }
      } catch (error) {
        console.error('Error processing Square callback:', error);
        setResult('error');
      } finally {
        setProcessing(false);
      }
    };
    
    processCallback();
  }, [searchParams, handleSquareCallback]);
  
  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };
  
  const handleGoToSettings = () => {
    navigate('/dashboard/settings');
  };
  
  if (processing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Spin 
            indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} 
            size="large"
          />
          <p className="mt-4 text-lg text-gray-600">
            Processing Square connection...
          </p>
        </div>
      </div>
    );
  }
  
  if (result === 'success') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Result
          status="success"
          icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
          title="Square POS Connected Successfully!"
          subTitle="Your Square Point of Sale integration is now active. You can start using Square features in your dashboard."
          extra={[
            <Button type="primary" key="dashboard" onClick={handleGoToDashboard}>
              Go to Dashboard
            </Button>,
            <Button key="settings" onClick={handleGoToSettings}>
              View Settings
            </Button>
          ]}
        />
      </div>
    );
  }
  
  if (result === 'error') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Result
          status="error"
          icon={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
          title="Connection Failed"
          subTitle={squareError || "We couldn't complete the Square connection. Please try again."}
          extra={[
            <Button type="primary" key="retry" onClick={() => window.location.reload()}>
              Try Again
            </Button>,
            <Button key="dashboard" onClick={handleGoToDashboard}>
              Go to Dashboard
            </Button>
          ]}
        />
      </div>
    );
  }
  
  return null;
};

export default SquareCallbackHandler;

