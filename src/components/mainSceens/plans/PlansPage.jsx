import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Row, Col, Spin, message, Typography } from 'antd';
import { CheckCircleOutlined, StarOutlined } from '@ant-design/icons';
import { useLocation } from 'react-router-dom';
import useStore from '../../../store/store';
import PlanCard from './PlanCard';
import PlanSelectionModal from './PlanSelectionModal';
import FeaturesTable from './FeaturesTable';

const { Title, Text } = Typography;

const PlansPage = () => {
  const { 
    packages, 
    currentPackage,
    loading: packagesLoading,
    error: packagesError,
    fetchPackages,
    getCurrentPackage,
    setCurrentPackage
  } = useStore();
  
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [expandedPlanId, setExpandedPlanId] = useState(null);
  const isTogglingRef = useRef(false);
  const hasLoadedRef = useRef(false);
  const location = useLocation();

  useEffect(() => {
    // Prevent duplicate calls
    if (hasLoadedRef.current && location.pathname === '/dashboard/plans') {
      return;
    }

    const loadData = async () => {
      // Check if we're returning from payment (check URL params or session storage)
      const isReturningFromPayment = sessionStorage.getItem('returningFromPayment') === 'true';
      const forceRefresh = isReturningFromPayment;
      
      if (forceRefresh) {
        // Clear the flag
        sessionStorage.removeItem('returningFromPayment');
        hasLoadedRef.current = false; // Reset to allow refresh
      }

      if (hasLoadedRef.current && !forceRefresh) {
        return;
      }

      hasLoadedRef.current = true;
      setIsInitialLoading(true);
      
      try {
        // Always call getCurrentPackage to check which plan user is using
        // This calls /restaurant_v2/subscription/current/ API
        const currentPackageResult = await getCurrentPackage(true);
        
        // Then fetch all packages
        const packagesResult = await fetchPackages(forceRefresh);
        
        // If packages were fetched, update current package
        if (packagesResult.success && packagesResult.data) {
          // If we got current package from subscription API, use it (this is the source of truth)
          if (currentPackageResult.success && currentPackageResult.data) {
            setCurrentPackage(currentPackageResult.data);
            
            // Clear is_current flags from all packages to avoid confusion
            // The subscription API result is the source of truth
            const cleanedPackages = packagesResult.data.map(p => ({
              ...p,
              is_current: false // Clear the flag, we'll use ID comparison instead
            }));
            // Note: We don't update packages in store here, just use cleanedPackages for display
          } else {
            // Fallback: find current package from is_current flag (only if API didn't return one)
            const currentPlanFromPackages = packagesResult.data.find(p => p.is_current);
            if (currentPlanFromPackages) {
              setCurrentPackage(currentPlanFromPackages);
            }
          }
        }
      } catch (error) {
        console.error('Error loading packages:', error);
        message.error('Failed to load subscription plans');
        hasLoadedRef.current = false; // Reset on error to allow retry
      } finally {
        setIsInitialLoading(false);
      }
    };
    
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const handlePlanClick = (plan) => {
    setSelectedPlan(plan);
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedPlan(null);
  };

  const handlePlanChangeSuccess = () => {
    setIsModalVisible(false);
    setSelectedPlan(null);
    // Refresh current package
    getCurrentPackage();
    message.success('Subscription plan updated successfully!');
  };

  const toggleFeatures = useCallback((planId) => {
    // Prevent rapid successive calls
    if (isTogglingRef.current) {
      return;
    }
    
    isTogglingRef.current = true;
    
    // Only expand the clicked card, collapse others
    setExpandedPlanId(prevExpandedId => {
      const newExpandedId = prevExpandedId === planId ? null : planId;
      // Reset the ref after state update
      setTimeout(() => {
        isTogglingRef.current = false;
      }, 200);
      return newExpandedId;
    });
  }, []);

  // Only show loading spinner on initial load, not when packages are already loaded
  if (isInitialLoading && (!packages || packages.length === 0)) {
    return (
      <div className="w-full flex justify-center items-center min-h-screen">
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

  // Ensure packages is always an array
  const packagesArray = Array.isArray(packages) ? packages : [];

  if (!packagesArray || packagesArray.length === 0) {
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
      {/* Header Section - Matching other dashboard pages */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-gray-200">
          {/* Left Side - Title and Description */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-orange-600 mb-2">
              Subscription Plans
            </h1>
            <p className="text-gray-600 text-lg">
              Choose the plan that best fits your restaurant's needs
            </p>
          </div>
          
          {/* Right Side - Current Plan Badge */}
          {(() => {
            // Prioritize currentPackage from subscription API over is_current flag
            const currentPlan = currentPackage || packagesArray.find(p => p.is_current);
            return currentPlan && (
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
            );
          })()}
        </div>
      </div>

      {/* Plans Grid */}
      <Row 
        gutter={[24, 24]} 
        className="mb-8"
        justify="center"
      >
        {packagesArray.map((plan) => {
          // Prioritize currentPackage from subscription API - compare by ID
          // Only use is_current flag if currentPackage is not available
          const isCurrentPlan = currentPackage 
            ? currentPackage.id === plan.id 
            : plan.is_current || false;
          // Mark middle plan as popular if no explicit flag
          const isPopular = plan.is_popular || plan.featured || 
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
                isPopular={isPopular}
                onClick={() => handlePlanClick(plan)}
                onToggleFeatures={(e) => {
                  if (e) {
                    e.stopPropagation();
                    e.preventDefault();
                  }
                  toggleFeatures(plan.id);
                }}
                isFeaturesExpanded={expandedPlanId === plan.id}
              />
            </Col>
          );
        })}
      </Row>

      {/* Plan Selection Modal */}
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

