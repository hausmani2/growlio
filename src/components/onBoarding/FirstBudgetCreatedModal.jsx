import React from 'react';
import { Button, Modal } from 'antd';

/**
 * Shown once on Budget after POS import creates the first budget.
 */
const FirstBudgetCreatedModal = ({ open, restaurantName, onClose }) => {
  const nameLabel = restaurantName ? ` for ${restaurantName}` : '';

  return (
    <Modal
      open={open}
      title="Congratulations!"
      closable
      maskClosable={false}
      centered
      width={520}
      destroyOnClose
      zIndex={1200}
      onCancel={onClose}
      footer={[
        <Button
          key="budget"
          type="primary"
          className="!bg-[#FF8132] hover:!bg-[#EB5B00] border-none"
          onClick={onClose}
        >
          View Budget
        </Button>,
      ]}
    >
      <div className="space-y-3 text-neutral-700">
        <p className="text-base font-semibold text-gray-800 m-0">
          Your first budget has been created{nameLabel}.
        </p>
        <p className="m-0">
          Growlio used your POS and setup details to build your starting weekly
          budget. Review labor, food cost, and projected profit by day, then keep
          entering daily actuals to stay on track.
        </p>
      </div>
    </Modal>
  );
};

export default FirstBudgetCreatedModal;
