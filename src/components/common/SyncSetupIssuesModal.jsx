import React from 'react';
import { Alert, Button, Modal } from 'antd';
import { useNavigate } from 'react-router-dom';

/**
 * Shown before POS sync when Your Setup does not match Square data
 * (channels, third-party, or $0 average hourly rate).
 */
const SyncSetupIssuesModal = ({
  open,
  loading = false,
  issues = [],
  onCancel,
  onProceed,
}) => {
  const navigate = useNavigate();
  const firstSetupPath = issues.find((issue) => issue.setup_path)?.setup_path;

  return (
    <Modal
      open={open}
      title="Setup needed for a complete sync"
      closable={false}
      maskClosable={false}
      zIndex={1200}
      footer={[
        <Button key="cancel" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>,
        firstSetupPath ? (
          <Button
            key="setup"
            onClick={() => {
              onCancel?.();
              navigate(firstSetupPath);
            }}
            disabled={loading}
          >
            Fix in Your Setup
          </Button>
        ) : null,
        <Button
          key="proceed"
          type="primary"
          className="!bg-[#FF8132] hover:!bg-[#EB5B00] border-none"
          loading={loading}
          onClick={onProceed}
        >
          Proceed anyway
        </Button>,
      ].filter(Boolean)}
      width={640}
      destroyOnClose
    >
      <Alert
        type="warning"
        showIcon
        className="mb-4"
        message="Square data may not match Your Setup"
        description="Fix these so sales channels, third-party delivery, and labor rates import correctly — otherwise sync can look incomplete."
      />
      <div className="space-y-3">
        {issues.map((issue) => (
          <div
            key={issue.code}
            className="rounded-lg border border-amber-100 bg-amber-50/60 p-3"
          >
            <p className="font-medium text-gray-900">{issue.title}</p>
            <p className="mt-1 text-sm text-gray-700">{issue.message}</p>
            {issue.setup_path ? (
              <Button
                type="link"
                className="!px-0 !mt-1"
                onClick={() => {
                  onCancel?.();
                  navigate(issue.setup_path);
                }}
              >
                Open setup
              </Button>
            ) : null}
          </div>
        ))}
      </div>
    </Modal>
  );
};

export default SyncSetupIssuesModal;
