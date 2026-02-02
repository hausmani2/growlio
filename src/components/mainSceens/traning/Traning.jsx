import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOutlined, 
  ExclamationCircleOutlined,
  LoadingOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import { Card, Modal, Button, message, Spin } from 'antd';
import useOnboardingStatus from '../../../hooks/useOnboardingStatus';

const Training = () => {
  const navigate = useNavigate();
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);
  const [showOnboardingRequiredModal, setShowOnboardingRequiredModal] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [hasCheckedOnMount, setHasCheckedOnMount] = useState(false);
  
  const {
    isSimulationUser,
    hasCompletedRegularOnboarding,
    hasSimulationAccess,
    canAccessTraining,
    activateSimulationMode,
    refreshOnboardingStatus,
    hasRegularRestaurants,
    hasSimulationRestaurants,
    regularRestaurants,
  } = useOnboardingStatus();

  // CRITICAL: On Training page mount, check regular onboarding status FIRST
  // Then call simulation activation API if needed
  // When user clicks Training:
  // 1. FIRST: Check regular user onboarding status (onboarding_complete)
  // 2. If onboarding_complete is false, show popup and stop
  // 3. If onboarding_complete is true, proceed with activation
  useEffect(() => {
    // Only run once on mount
    if (hasCheckedOnMount) return;
    
    const handleTrainingPageLoad = async () => {
      setHasCheckedOnMount(true);
      
      // FIRST: Check regular onboarding status before activation
      if (hasRegularRestaurants && regularRestaurants && regularRestaurants.length > 0) {
        const allIncomplete = regularRestaurants.every(r => r.onboarding_complete === false);
        
        if (allIncomplete) {
          // Show popup and stop - don't proceed with activation
          setShowOnboardingRequiredModal(true);
          return;
        }
      }
      
      // Only proceed with activation if onboarding is complete or user has no regular restaurants
      setIsActivating(true);
      
      try {
        // Step 1: POST /authentication/user/restaurant-simulation/ with { restaurant_simulation: true }
        const activationResult = await activateSimulationMode();
        
        if (activationResult.success) {
          // Step 2: Refresh onboarding status (both APIs are already called in activateSimulationMode)
          // But we call refreshOnboardingStatus again to ensure we have the latest data
          const refreshResult = await refreshOnboardingStatus();
          
          if (!refreshResult.success) {
            console.warn('⚠️ [Training] Failed to refresh onboarding status:', refreshResult.error);
          }
        } else {
          console.warn('⚠️ [Training] Simulation activation failed:', activationResult.error);
          message.warning('Could not activate simulation mode. Please try again.');
        }
      } catch (error) {
        console.error('❌ [Training] Error during training page initialization:', error);
        message.error('An error occurred while activating training mode.');
      } finally {
        setIsActivating(false);
      }
    };
    
    // Run the initialization
    handleTrainingPageLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasCheckedOnMount, hasRegularRestaurants, regularRestaurants, hasCompletedRegularOnboarding]); // Only run once on mount


  // First check: Regular user onboarding status
  // Priority: Check regular onboarding status BEFORE checking simulation access
  useEffect(() => {
    // Wait for activation check to complete
    if (isActivating) return;
    
    // STEP 1: Check if user has regular restaurants
    if (hasRegularRestaurants && regularRestaurants && regularRestaurants.length > 0) {
      // Check if onboarding_complete is false for all regular restaurants
      const allIncomplete = regularRestaurants.every(r => r.onboarding_complete === false);
      
      if (allIncomplete) {
        // Show popup: "Please complete the onboarding to access Training"
        setShowOnboardingRequiredModal(true);
        setShowIncompleteModal(false); // Hide simulation modal if shown
        return;
      }
      
      // If at least one restaurant has onboarding_complete === true, allow access
      if (hasCompletedRegularOnboarding) {
        setShowOnboardingRequiredModal(false);
        setShowIncompleteModal(false);
        return; // Show the page
      }
    }
    
    // STEP 2: If no regular restaurants or regular onboarding is complete, check simulation access
    // Only check simulation if user doesn't have regular restaurants OR regular onboarding is complete
    if (!hasRegularRestaurants || hasCompletedRegularOnboarding) {
      if (!canAccessTraining && !hasCompletedRegularOnboarding && hasSimulationAccess) {
        // User has simulation access but hasn't activated it - show modal
        setShowIncompleteModal(true);
      } else if (!canAccessTraining && !hasCompletedRegularOnboarding && !hasSimulationAccess && !hasRegularRestaurants) {
        // User has no access and no regular restaurants - redirect to onboarding
        message.warning('Please complete your onboarding to access Training');
        navigate('/dashboard');
      }
    }
  }, [isActivating, hasRegularRestaurants, regularRestaurants, hasCompletedRegularOnboarding, canAccessTraining, hasSimulationAccess, navigate]);

  // Note: handleTrainingClick is not used in this component
  // The Training menu click is handled by the Wrapper component navigation
  // This component receives the user and shows appropriate content based on onboarding status

  // Activate simulation mode and redirect
  const handleActivateSimulation = async () => {
    setIsActivating(true);
    try {
      const result = await activateSimulationMode();
      
      if (result.success) {
        message.success('Simulation mode activated successfully!');
        setShowIncompleteModal(false);
        
        // Refresh the page to show updated content
        setTimeout(() => {
          window.location.reload();
        }, 300);
      } else {
        message.error(result.error || 'Failed to activate simulation mode');
      }
    } catch (error) {
      console.error('Error activating simulation:', error);
      message.error('An error occurred while activating simulation mode');
    } finally {
      setIsActivating(false);
    }
  };



  // Show loading spinner while activating simulation and checking onboarding status
  if (isActivating) {
    return (
      <div className="w-full mx-auto flex flex-col items-center justify-center min-h-[60vh]">
        <Spin 
          size="large" 
          indicator={<LoadingOutlined style={{ fontSize: 48, color: '#FF8132' }} spin />}
        />
        <div className="mt-4 text-gray-600 text-lg">Activating Training Mode...</div>
      </div>
    );
  }

  // Don't show page content if onboarding is required
  if (showOnboardingRequiredModal) {
    return (
      <div className="w-full mx-auto">
        {/* Onboarding Required Modal */}
        <Modal
          title={
            <div className="flex items-center gap-2">
              <ExclamationCircleOutlined className="text-orange-600 text-xl" />
              <span>Onboarding Required</span>
            </div>
          }
          open={showOnboardingRequiredModal}
          onCancel={() => {
            setShowOnboardingRequiredModal(false);
            navigate('/dashboard/report-card');
          }}
          footer={[
            <Button 
              key="ok" 
              type="primary"
              onClick={() => {
                setShowOnboardingRequiredModal(false);
                navigate('/dashboard/report-card');
              }}
              className="bg-orange-600 hover:bg-orange-700"
            >
              OK
            </Button>,
          ]}
          width={600}
          closable={false}
          maskClosable={false}
        >
          <div className="py-4">
            <p className="text-gray-700 mb-4 text-base">
              Please complete the onboarding to access Training.
            </p>
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-3 border-b border-gray-200">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-orange-600 mb-2">
              Training
            </h1>
            <p className="text-gray-600 text-lg">
              Comprehensive training resources and guides to help you master Growlio
            </p>
          </div>
        </div>
        <div className="mt-6">
            <Button 
              type="primary" 
              size="large"
              onClick={() => navigate('/simulation/dashboard')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Go to Simulation Dashboard
            </Button>
          </div>
      </div>

      {/* Incomplete Onboarding Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <ExclamationCircleOutlined className="text-orange-600 text-xl" />
            <span>Complete Onboarding Required</span>
          </div>
        }
        open={showIncompleteModal}
        onCancel={() => setShowIncompleteModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowIncompleteModal(false)}>
            Cancel
          </Button>,
          <Button
            key="activate"
            type="primary"
            onClick={handleActivateSimulation}
            loading={isActivating}
            disabled={isActivating}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isActivating ? (
              <>
                <LoadingOutlined className="mr-2" />
                Activating...
              </>
            ) : (
              'Activate Simulation Training'
            )}
          </Button>,
        ]}
        width={600}
      >
        <div className="py-4">
          <p className="text-gray-700 mb-4">
            To access Training, you need to either:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
            <li>Complete your regular restaurant onboarding, or</li>
            <li>Activate Simulation Training mode</li>
          </ul>
          <p className="text-gray-700 mb-4">
            Simulation Training allows you to practice using Growlio without affecting your real restaurant data.
          </p>
          <p className="text-sm text-gray-500">
            Would you like to activate Simulation Training now?
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default Training;