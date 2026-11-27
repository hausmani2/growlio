import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeaderSection from '../../common/PageHeaderSection';
import DeliveryIntelligence from './DeliveryIntelligence';

const DeliveryIntelligencePage = () => {
  const navigate = useNavigate();

  return (
    <div className="p-2 md:p-4">
      <PageHeaderSection
        title="Delivery Intelligence"
        description="Are your third-party delivery sales adding profit or just volume?"
      />
      <DeliveryIntelligence
        onSetupMenu={() => navigate('/dashboard/food-costing')}
        onSetupDelivery={() => navigate('/dashboard/third-party-delivery')}
      />
    </div>
  );
};

export default DeliveryIntelligencePage;
