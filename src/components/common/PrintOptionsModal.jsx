import React from 'react';
import { Modal, Button, Radio, Space, Typography } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';

const { Text } = Typography;

const PrintOptionsModal = ({ visible, onCancel, onPrint }) => {
  const [printOption, setPrintOption] = React.useState('report-only');

  const handlePrint = () => {
    onPrint(printOption);
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <PrinterOutlined className="text-blue-600" />
          <span>Print Options</span>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
          Print
        </Button>
      ]}
      width={500}
      centered
    >
      <div className="py-4">
        <Text className="text-gray-700 mb-4 block">
          Choose what you'd like to include in your print:
        </Text>
        
        <Radio.Group 
          value={printOption} 
          onChange={(e) => setPrintOption(e.target.value)}
          className="w-full"
        >
          <Space direction="vertical" size="middle" className="w-full">
            <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <Radio value="report-only" className="w-full">
                <div className="ml-2">
                  <div className="font-medium text-gray-800">Report Only</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Print just the summary table with data (recommended for quick reference)
                  </div>
                </div>
              </Radio>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <Radio value="report-with-charts" className="w-full">
                <div className="ml-2">
                  <div className="font-medium text-gray-800">Report with Charts</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Print the summary table plus all charts and visualizations (landscape format)
                  </div>
                </div>
              </Radio>
            </div>
          </Space>
        </Radio.Group>
        
        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Text className="text-blue-800 text-sm">
            <strong>Note:</strong> The report will be formatted in landscape mode for better readability. 
            Charts will be included only if you select "Report with Charts".
          </Text>
        </div>
      </div>
    </Modal>
  );
};

export default PrintOptionsModal;