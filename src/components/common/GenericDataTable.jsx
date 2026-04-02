import React from 'react';
import { Alert, Table } from 'antd';

const GenericDataTable = ({
  rowKey = 'id',
  columns,
  dataSource,
  loading,
  error,
  pagination,
  onChange,
}) => {
  return (
    <div className="w-full">
      {error ? (
        <div className="mb-3">
          <Alert type="error" showIcon message="Something went wrong" description={error} />
        </div>
      ) : null}
      <Table
        rowKey={rowKey}
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        onChange={onChange}
        scroll={{ x: 900 }}
        pagination={pagination}
        locale={{
          emptyText: error ? 'Failed to load data.' : 'No data found.',
        }}
      />
    </div>
  );
};

export default GenericDataTable;

