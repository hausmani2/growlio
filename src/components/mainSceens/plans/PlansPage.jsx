import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Spin, message, Typography } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { useLocation } from 'react-router-dom';
import useStore from '../../../store/store';
import PlanCard from './PlanCard';
import PlanSelectionModal from './PlanSelectionModal';

const { Text } = Typography;

const PlansPage = () => {
  const {
    packages,
    currentPackage,
    error: packagesError,
    fetchPackages,
    getCurrentPackage,
    setCurrentPackage,
    fetchCurrentSubscriptionDetails,
  } = useStore();

  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [expandedPlanId, setExpandedPlanId] = useState(null);
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setIsLoading(true);

      try {
        const currentPackageResult = await getCurrentPackage(true);
        const packagesResult = await fetchPackages(true);

        if (cancelled) return;

        if (packagesResult.success && packagesResult.data) {
          if (currentPackageResult.success && currentPackageResult.data) {
            setCurrentPackage(currentPackageResult.data);
          } else {
            const currentPlanFromPackages = packagesResult.data.find((p) => p.is_current);
            if (currentPlanFromPackages) {
              setCurrentPackage(currentPlanFromPackages);
            }
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Error loading packages:', error);
          message.error('Failed to load subscription plans');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [location.pathname, fetchPackages, getCurrentPackage, setCurrentPackage]);

  const handlePlanClick = (plan) => {
    setSelectedPlan(plan);
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedPlan(null);
  };

  const handlePlanChangeSuccess = async () => {
    setIsModalVisible(false);
    setSelectedPlan(null);
    await Promise.all([
      getCurrentPackage(true),
      fetchPackages(true),
      fetchCurrentSubscriptionDetails?.(true),
    ]);
    message.success('Subscription plan updated successfully!');
  };

  const toggleFeatures = useCallback((planId) => {
    setExpandedPlanId((prevExpandedId) => (prevExpandedId === planId ? null : planId));
  }, []);

  if (isLoading) {
    return (
      <div className="w-full flex justify-center items-center min-h-[400px]">
        <Spin size="large" tip="Loading subscription plans..." />
      </div>
    );
  }

  if (packagesError) {
    return (
      <div className="w-full mx-auto p-6">
        <Card>
          <div className="text-center py-8">
            <Text type="danger">Error loading plans: {packagesError}</Text>
          </div>
        </Card>
      </div>
    );
  }

  const packagesArray = Array.isArray(packages) ? packages : [];

  if (!packagesArray.length) {
    return (
      <div className="w-full mx-auto p-6">
        <Card>
          <div className="text-center py-8">
            <Text>No subscription plans available at this time.</Text>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto">
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-gray-200">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-orange-600 mb-2">Subscription Plans</h1>
            <p className="text-gray-600 text-lg">
              Choose the plan that best fits your restaurant&apos;s needs
            </p>
          </div>

          {(() => {
            const currentPlan = currentPackage || packagesArray.find((p) => p.is_current);
            return (
              currentPlan && (
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg px-5 py-2 flex items-center gap-3 shadow-md">
                  <div className="bg-white/20 rounded-full px-2">
                    <CheckCircleOutlined className="text-white text-sm" />
                  </div>
                  <div>
                    <Text className="text-orange-100 text-sm font-medium">
                      {currentPlan.display_name || currentPlan.name}
                    </Text>
                    {currentPlan.price_per_location !== undefined && (
                      <Text className="text-orange-100 text-xs block mt-0.5">
                        {currentPlan.price_per_location === 0
                          ? 'Free Forever'
                          : `$${currentPlan.price_per_location}/location/month`}
                      </Text>
                    )}
                  </div>
                </div>
              )
            );
          })()}
        </div>
      </div>

      <Row gutter={[24, 24]} className="mb-8" justify="center">
        {packagesArray.map((plan) => {
          const isCurrentPlan = currentPackage
            ? currentPackage.id === plan.id
            : Boolean(plan.is_current);
          const isPopular =
            plan.is_popular ||
            plan.featured ||
            (packagesArray.length === 3 && plan.id === packagesArray[1]?.id);

          return (
            <Col
              key={plan.id}
              xs={24}
              sm={24}
              md={packagesArray.length === 2 ? 12 : packagesArray.length === 3 ? 8 : 12}
              lg={packagesArray.length === 2 ? 12 : packagesArray.length === 3 ? 8 : 6}
              xl={packagesArray.length === 2 ? 12 : packagesArray.length === 3 ? 8 : 6}
              style={{ display: 'flex' }}
            >
              <PlanCard
                plan={plan}
                isCurrentPlan={isCurrentPlan}
                isPopular={isPopular && !isCurrentPlan}
                onClick={() => handlePlanClick(plan)}
                onToggleFeatures={(e) => {
                  e?.stopPropagation();
                  e?.preventDefault();
                  toggleFeatures(plan.id);
                }}
                isFeaturesExpanded={expandedPlanId === plan.id}
              />
            </Col>
          );
        })}
      </Row>

      {selectedPlan && (
        <PlanSelectionModal
          visible={isModalVisible}
          plan={selectedPlan}
          currentPlan={currentPackage}
          onClose={handleModalClose}
          onSuccess={handlePlanChangeSuccess}
        />
      )}
    </div>
  );
};

export default PlansPage;
