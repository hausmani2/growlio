import React, { useEffect } from 'react';
import { Card, Table, Typography, Spin, Alert } from 'antd';
import useStore from '../../../store/store';
import PageHeaderSection from '../../common/PageHeaderSection';

const { Text } = Typography;

const PosIntegrationsPage = () => {
  const integrations = useStore((s) => s.posIntegrations);
  const loading = useStore((s) => s.posIntegrationsLoading);
  const error = useStore((s) => s.posIntegrationsError);
  const fetchPosIntegrations = useStore((s) => s.fetchPosIntegrations);
  const clearPosIntegrationsError = useStore((s) => s.clearPosIntegrationsError);

  useEffect(() => {
    fetchPosIntegrations();
  }, [fetchPosIntegrations]);

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name) => <Text strong>{name}</Text>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text) => text || '—',
    },
  ];

  return (
    <div className="p-4 md:p-6">
      <PageHeaderSection
        title="POS Integrations"
        description="Supported point-of-sale providers available on Growlio"
      />

      {error && (
        <Alert
          type="error"
          message={error}
          closable
          onClose={clearPosIntegrationsError}
          className="mb-4"
        />
      )}

      <Card>
        <Spin spinning={loading}>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={integrations}
            pagination={false}
            locale={{ emptyText: 'No POS integrations found' }}
          />
        </Spin>
      </Card>
    </div>
  );
};

export default PosIntegrationsPage;
