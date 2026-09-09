import React from 'react';
import { Alert, Button, Modal, Table } from 'antd';

/**
 * Shown before POS sync when Square labor has employees with no hourly wage.
 */
const MissingLaborRatesModal = ({
  open,
  loading = false,
  employees = [],
  onCancel,
  onProceed,
}) => {
  const columns = [
    {
      title: 'Employee',
      dataIndex: 'name',
      key: 'name',
      render: (name, row) => name || row.team_member_id || 'Unknown',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role, row) => {
        if (role) return role;
        const roles = row.roles;
        if (Array.isArray(roles) && roles.length) return roles.join(', ');
        return '—';
      },
    },
    {
      title: 'Shifts',
      dataIndex: 'shift_count',
      key: 'shift_count',
      width: 90,
    },
    {
      title: 'Hours',
      dataIndex: 'total_hours',
      key: 'total_hours',
      width: 100,
      render: (v) => (v != null ? Number(v).toFixed(2) : '—'),
    },
  ];

  return (
    <Modal
      open={open}
      title="Employees missing labor rate"
      closable={false}
      maskClosable={false}
      footer={[
        <Button key="cancel" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>,
        <Button
          key="proceed"
          type="primary"
          className="!bg-[#FF8132] hover:!bg-[#EB5B00] border-none"
          loading={loading}
          onClick={onProceed}
        >
          Proceed anyway
        </Button>,
      ]}
      width={640}
      destroyOnClose
    >
      <Alert
        type="warning"
        showIcon
        className="mb-4"
        message={`${employees.length} employee(s) have no hourly wage in Square`}
        description="You can still import. Update these employee wage rates in Square — Growlio will pick them up on the next import."
      />
      <Table
        size="small"
        rowKey={(row) => row.team_member_id || row.name}
        pagination={false}
        dataSource={employees}
        columns={columns}
        locale={{ emptyText: 'No employees found' }}
      />
    </Modal>
  );
};

export default MissingLaborRatesModal;
