import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  BookOutlined, 
  ExclamationCircleOutlined,
  LoadingOutlined,
  PlayCircleOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
  RightOutlined,
  ReloadOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { Card, Modal, Button, message, Spin } from 'antd';
import useOnboardingStatus from '../../../hooks/useOnboardingStatus';
import useStore from '../../../store/store';
import { apiGet } from '../../../utils/axiosInterceptors';

const Training = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const prevLocationRef = useRef(location.pathname);
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);
  const [showOnboardingRequiredModal, setShowOnboardingRequiredModal] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [hasCheckedOnMount, setHasCheckedOnMount] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isVideoModalVisible, setIsVideoModalVisible] = useState(false);
  const refreshInProgressRef = useRef(false);
  const lastRefreshTimeRef = useRef(0);
  const lastOnboardingCheckRef = useRef(null);
  const initializationStartedRef = useRef(false);
  
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
    // Only run once on mount - use ref to prevent re-runs
    if (initializationStartedRef.current) return;
    if (hasCheckedOnMount) return;
    
    initializationStartedRef.current = true;
    
    const handleTrainingPageLoad = async () => {
      setHasCheckedOnMount(true);
      
      // FIRST: Check regular onboarding status before activation
      // If user has regular restaurants, check if onboarding is complete
      if (hasRegularRestaurants && regularRestaurants && regularRestaurants.length > 0) {
        const allIncomplete = regularRestaurants.every(r => r.onboarding_complete === false);
        
        if (allIncomplete || !hasCompletedRegularOnboarding) {
          // Show popup and stop - don't proceed with activation
          setShowOnboardingRequiredModal(true);
          return; // CRITICAL: Return early to prevent activation
        }
      }
      
      // Only proceed with activation if:
      // 1. User has completed regular onboarding, OR
      // 2. User has NO regular restaurants (simulation-only user)
      const shouldActivate = hasCompletedRegularOnboarding || !hasRegularRestaurants;
      
      if (!shouldActivate) {
        // Don't activate - show modal instead
        setShowOnboardingRequiredModal(true);
        return;
      }
      
      // CRITICAL: Don't activate if we're already activating
      if (isActivating) {
        return;
      }
      
      setIsActivating(true);
      
      try {
        // Step 1: POST /authentication/user/restaurant-simulation/ with { restaurant_simulation: true }
        // This already calls refreshOnboardingStatus internally, so we don't need to call it again
        const activationResult = await activateSimulationMode();
        
        if (!activationResult.success) {
          console.warn('⚠️ [Training] Simulation activation failed:', activationResult.error);
          message.warning('Could not activate simulation mode. Please try again.');
        }
        // Don't call refreshOnboardingStatus again - it's already called in activateSimulationMode
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
  }, []); // Empty deps - only run once on mount


  // First check: Regular user onboarding status
  // Priority: Check regular onboarding status BEFORE checking simulation access
  useEffect(() => {
    // Wait for activation check to complete
    if (isActivating) return;
    
    // Create a key to track if we've already handled this state
    const currentStateKey = `${hasRegularRestaurants}-${hasCompletedRegularOnboarding}-${canAccessTraining}-${hasSimulationAccess}`;
    
    // Skip if we've already processed this exact state
    if (lastOnboardingCheckRef.current === currentStateKey) {
      return;
    }
    
    lastOnboardingCheckRef.current = currentStateKey;
    
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

  // Map step names to their routes
  const getStepRoute = (stepName) => {
    const stepRouteMap = {
      'Basic Information': '/dashboard/basic-information',
      'Operating Information': '/dashboard/sales-channels',
      'Labour Information': '/dashboard/labor-information',
      'Food Cost Details': '/dashboard/food-cost-details',
      'Third-Party Info': '/dashboard/third-party-delivery',
      'Expense': '/dashboard/expense',
      'Sales Information': '/dashboard/sales-data',
      'One Month Sales Information': '/onboarding/profitability'
    };
    return stepRouteMap[stepName] || '/onboarding';
  };

  // Get incomplete onboarding steps
  const getIncompleteSteps = () => {
    if (!regularRestaurants || regularRestaurants.length === 0) {
      return [];
    }

    // Get the first restaurant (or combine all restaurants' incomplete steps)
    const restaurant = regularRestaurants[0];
    
    // Steps to exclude from the list
    const excludeKeys = [
      'restaurant_id',
      'restaurant_name',
      'onboarding_complete',
      'completion_percentage',
      'Create Account', // This is always true
    ];

    // Extract incomplete steps (where value is false)
    const incompleteSteps = [];
    Object.keys(restaurant).forEach(key => {
      if (!excludeKeys.includes(key) && restaurant[key] === false) {
        incompleteSteps.push({
          name: key,
          route: getStepRoute(key)
        });
      }
    });

    return incompleteSteps;
  };

  // Handle refresh onboarding data with guards to prevent infinite loops
  // IMPORTANT: Only call /restaurant_v2/restaurants-onboarding/ API, NOT the simulation API
  const handleRefreshOnboarding = useCallback(async () => {
    // Prevent multiple simultaneous refreshes
    if (refreshInProgressRef.current) {
      return;
    }
    
    // Throttle: Don't refresh if we just refreshed less than 2 seconds ago
    const now = Date.now();
    if (now - lastRefreshTimeRef.current < 2000) {
      return;
    }
    
    // Check sessionStorage to prevent concurrent calls
    const hasCheckedGlobally = sessionStorage.getItem('hasCheckedRestaurantOnboardingGlobal');
    const lastCheckTime = sessionStorage.getItem('restaurantOnboardingLastCheckTime');
    
    if (hasCheckedGlobally === 'true' && lastCheckTime) {
      const timeSinceCheck = now - parseInt(lastCheckTime);
      if (timeSinceCheck < 2000) {
        // Too soon to check again
        return;
      }
    }
    
    // Mark as checking globally
    sessionStorage.setItem('hasCheckedRestaurantOnboardingGlobal', 'true');
    sessionStorage.setItem('restaurantOnboardingLastCheckTime', now.toString());
    
    refreshInProgressRef.current = true;
    lastRefreshTimeRef.current = now;
    setIsRefreshing(true);
    
    try {
      // Only call the restaurant onboarding API, not the simulation one
      const response = await apiGet('/restaurant_v2/restaurants-onboarding/');
      
      // Handle response structure (similar to authSlice)
      let restaurantData = response.data;
      if (response.data?.data && (response.data.data.restaurants || Array.isArray(response.data.data))) {
        restaurantData = response.data.data;
      } else if (response.data?.restaurants) {
        restaurantData = response.data;
      } else if (response.data?.data) {
        restaurantData = response.data.data;
      }
      
      // Update the store with the new data using Zustand's setState
      useStore.setState({
        restaurantOnboardingData: restaurantData,
        restaurantOnboardingDataTimestamp: now
      });
      
      // Extract restaurant_id if available
      const restaurantId = restaurantData?.restaurant_id || restaurantData?.restaurants?.[0]?.restaurant_id || null;
      if (restaurantId) {
        localStorage.setItem('restaurant_id', restaurantId.toString());
        useStore.setState({ restaurantId: restaurantId.toString() });
      }
      
      message.success('Onboarding status updated');
    } catch (error) {
      console.error('Error refreshing onboarding:', error);
      message.error('Failed to refresh onboarding status');
    } finally {
      setIsRefreshing(false);
      refreshInProgressRef.current = false;
    }
  }, []); // No dependencies - uses apiGet directly

  // Refresh onboarding data when modal opens (only once)
  useEffect(() => {
    if (showOnboardingRequiredModal && !refreshInProgressRef.current) {
      // Small delay to avoid immediate refresh on mount
      const timer = setTimeout(() => {
        handleRefreshOnboarding();
      }, 300);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showOnboardingRequiredModal]); // Only depend on modal state, not the function

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
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <ExclamationCircleOutlined className="text-orange-600 text-xl" />
                <span>Onboarding Required</span>
              </div>
              <Button
                type="text"
                icon={<ReloadOutlined />}
                onClick={handleRefreshOnboarding}
                loading={isRefreshing}
                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                title="Refresh onboarding status"
              >
                Refresh
              </Button>
            </div>
          }
          open={showOnboardingRequiredModal}
          onCancel={() => {
            setShowOnboardingRequiredModal(false);
            navigate('/dashboard/report-card');
          }}
          footer={[
            <Button 
              key="cancel" 
              onClick={() => {
                setShowOnboardingRequiredModal(false);
                navigate('/dashboard/report-card');
              }}
            >
              Cancel
            </Button>,
            <Button 
              key="onboarding" 
              type="primary"
              onClick={() => {
                setShowOnboardingRequiredModal(false);
                navigate('/onboarding');
              }}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Go to Onboarding
            </Button>,
          ]}
          width={650}
          closable={false}
          maskClosable={false}
        >
          <div className="py-4">
            <p className="text-gray-700 mb-4 text-base">
              Please complete the onboarding to access Training.
            </p>
            
            {regularRestaurants && regularRestaurants.length > 0 && (
              <div className="mt-4">
                {regularRestaurants[0].completion_percentage !== undefined && (
                  <div className="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Completion Progress</span>
                      <span className="text-sm font-bold text-orange-600">
                        {regularRestaurants[0].completion_percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${regularRestaurants[0].completion_percentage}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {getIncompleteSteps().length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-gray-700 mb-3">
                      Remaining Steps to Complete:
                    </p>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {getIncompleteSteps().map((step, index) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <CloseCircleOutlined className="text-red-500 flex-shrink-0" />
                            <span className="text-sm text-gray-700 font-medium">{step.name}</span>
                          </div>
                          <Button
                            type="primary"
                            size="small"
                            icon={<RightOutlined />}
                            onClick={() => {
                              setShowOnboardingRequiredModal(false);
                              navigate(step.route);
                            }}
                            className="bg-orange-600 hover:bg-orange-700 border-0 flex-shrink-0"
                          >
                            Go to Step
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {getIncompleteSteps().length === 0 && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600">
                      All steps are complete. Please refresh the page or contact support if you still see this message.
                    </p>
                  </div>
                )}
              </div>
            )}
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
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold text-orange-600">
                Training
              </h1>
              <button
                onClick={() => setIsVideoModalVisible(true)}
                className="text-orange-600 hover:text-orange-700 transition-colors"
                title="Watch tutorial video"
                aria-label="Info about Budget Dashboard Tutorial"
              >
                <InfoCircleOutlined className="text-lg" />
              </button>
            </div>
            <p className="text-gray-600 text-lg">
              Comprehensive training resources and guides to help you master Growlio
            </p>
          </div>
        </div>
        {/* <div className="mt-6">
            <Button 
              type="primary" 
              size="large"
              onClick={() => navigate('/simulation/dashboard')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Go to Simulation Dashboard
            </Button>
          </div> */}
      </div>

      {/* Budget Dashboard Tutorial Section */}
      <div className='p-3 bg-white rounded-xl shadow-lg border border-gray-100 mb-5'>
        <div className='flex items-center justify-between gap-2'>
          <p className='font-medium text-base text-orange-600'>
            Watch a tutorial on how to create a <span className='text-purple-600'> Budget Dashboard</span>
          </p>
          <button
            onClick={() => setIsVideoModalVisible(true)}
            className="text-blue-600 hover:text-blue-800 transition-colors font-medium text-base border border-blue-600 rounded-md px-4 py-2"
            title="Watch tutorial video"
            aria-label="Watch Budget Dashboard Tutorial"
          >
            Watch Video
          </button>
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

      {/* YouTube Video Tutorial Modal */}
      <Modal
        title="Weekly Budgeted Dashboard Tutorial"
        open={isVideoModalVisible}
        onCancel={() => setIsVideoModalVisible(false)}
        footer={null}
        width={900}
        centered
        destroyOnClose={true}
      >
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', maxWidth: '100%' }}>
          <iframe
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              border: 0
            }}
            src="https://www.youtube.com/embed/aXUSZtOxN-k"
            title="Weekly Budgeted Dashboard Tutorial"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </Modal>
    </div>
  );
};

export default Training;