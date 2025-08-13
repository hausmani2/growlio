import React, { useState } from 'react';
import { Modal, Button, Typography, Divider, Space } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

const DisclaimerModal = ({ 
  isOpen, 
  onClose, 
  onAccept, 
  title = "Important Disclaimer",
  showAcceptButton = true 
}) => {
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    try {
      if (onAccept) {
        await onAccept();
      }
    } finally {
      setLoading(false);
      onClose();
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Modal
      title={
        <Space>
          <ExclamationCircleOutlined style={{ color: '#faad14' }} />
          <span>{title}</span>
        </Space>
      }
      open={isOpen}
      onCancel={handleCancel}
      footer={
        showAcceptButton ? [
          <Button key="cancel" onClick={handleCancel}>
            Cancel
          </Button>,
          <Button 
            key="accept" 
            type="primary" 
            onClick={handleAccept}
            loading={loading}
            style={{ backgroundColor: '#1890ff' }}
          >
            I Understand and Accept
          </Button>
        ] : [
          <Button key="close" type="primary" onClick={handleCancel}>
            Close
          </Button>
        ]
      }
      width={800}
      centered
      maskClosable={false}
      closable={!showAcceptButton}
    >
             <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
         <Typography>
           <Title level={4} style={{ color: '#1890ff', marginBottom: 16 }}>
             Disclaimer:
           </Title>
           <Paragraph style={{ fontSize: '14px', lineHeight: '1.6' }}>
             Growlio is a free informational tool designed to help restaurant operators track and better understand key business metrics such as food cost, labor cost, and sales. It is not intended to serve as financial, legal, or business advice. The use of Growlio does not guarantee profitability, improved performance, or any specific business outcome.
           </Paragraph>

           <Divider />

           <Title level={4} style={{ color: '#1890ff', marginBottom: 16 }}>
             No Earnings Claims or Guarantees:
           </Title>
           <Paragraph style={{ fontSize: '14px', lineHeight: '1.6' }}>
             Any examples, projections, or calculations provided by Growlio—whether actual, estimated, or hypothetical—are for illustrative purposes only. They are not to be construed as a promise or guarantee of earnings, profit, savings, or financial performance. Past results do not predict or guarantee future outcomes.
           </Paragraph>

           <Divider />

           <Title level={4} style={{ color: '#1890ff', marginBottom: 16 }}>
             Limitation of Liability:
           </Title>
           <Paragraph style={{ fontSize: '14px', lineHeight: '1.6' }}>
             By using Growlio, you agree that the creator(s), owner(s), and associated parties are not responsible for any financial losses, business outcomes, decisions, or liabilities that may arise from its use. You assume full responsibility for how you interpret and act on any data or insights provided. Growlio is provided "as is" without any warranties, express or implied, including but not limited to fitness for a particular purpose or merchantability.
           </Paragraph>

           <Divider />

           <Title level={4} style={{ color: '#1890ff', marginBottom: 16 }}>
             Accuracy and User Responsibility:
           </Title>
           <Paragraph style={{ fontSize: '14px', lineHeight: '1.6' }}>
             While every effort has been made to ensure the accuracy and utility of the tool, Growlio does not guarantee the completeness, reliability, or timeliness of any calculations, data, or outputs. All inputs and usage decisions are the responsibility of the user, and it is recommended that you consult with financial or legal professionals when making business decisions.
           </Paragraph>

           <Divider />

           <Title level={4} style={{ color: '#1890ff', marginBottom: 16 }}>
             No Professional Relationship Created:
           </Title>
           <Paragraph style={{ fontSize: '14px', lineHeight: '1.6' }}>
             Use of Growlio does not create a client, advisory, fiduciary, or professional relationship between the user and the creator(s) of the tool.
           </Paragraph>

        
        </Typography>
      </div>
    </Modal>
  );
};

export default DisclaimerModal;
