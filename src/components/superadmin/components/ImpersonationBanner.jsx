import React from 'react';
import { Alert, Button, Space } from 'antd';
import { UserSwitchOutlined, StopOutlined } from '@ant-design/icons';
import useStore from '../../../store/store';
import { 
  isImpersonating, 
  getImpersonatedUser, 
  getImpersonatedUserData, 
  getImpersonationMessage 
} from '../../../utils/tokenManager';

const ImpersonationBanner = () => {
  const stopImpersonation = useStore((state) => state.stopImpersonation);
  
  // Use tokenManager's isImpersonating function to avoid persisted key collisions

  const handleStopImpersonation = async () => {
    try {
      const result = await stopImpersonation();
      if (result.success) {
        // Success message will be handled by the calling component
      } else {
        // Error message will be handled by the calling component
      }
    } catch (error) {
    }
  };

  if (!isImpersonating()) {
    return null;
  }

  const impersonatedUserData = getImpersonatedUserData();
  const impersonationMessage = getImpersonationMessage();

  return (
    <Alert
      message={
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <UserSwitchOutlined className="mr-2" />
            <div>
              <div>
                <strong>Impersonation Active:</strong> You are currently impersonating{' '}
                <strong>{getImpersonatedUser()}</strong>
                {impersonatedUserData && (
                  <span className="ml-2 text-sm text-gray-600">
                    ({impersonatedUserData.username} - {impersonatedUserData.role})
                  </span>
                )}
              </div>
              {impersonationMessage && (
                <div className="text-sm text-gray-600 mt-1">
                  {impersonationMessage}
                </div>
              )}
            </div>
          </div>
          <Button
            type="primary"
            danger
            size="small"
            icon={<StopOutlined />}
            onClick={handleStopImpersonation}
          >
            Stop Impersonation
          </Button>
        </div>
      }
      type="warning"
      showIcon={false}
      className="mb-4"
      style={{
        backgroundColor: '#fff7e6',
        border: '1px solid #ffd591',
        borderRadius: '6px'
      }}
    />
  );
};

export default ImpersonationBanner;
