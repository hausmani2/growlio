import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { message } from 'antd';
import RestaurantWrapper from './steps/basicInformation/RestaurantWrapper';
import FoodCostWrapper from './steps/foodCostDetails/FoodCostWrapper';
import LaborInformationWrapper from './steps/laborInformation/LaborInformationWrapper';
import { TabContext } from './context/TabContext';
import SalesChannelsWrapper from './steps/salesChannels/SalesChannelsWrapper';
import ExpenseWrapper from './steps/Expense/ExpenseWrapper';
import useStore from '../../../store/store';

export const TabProvider = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState(0);
    const { completeOnboardingData, resetStepStatus, getRestaurantId, ensureAllStepsInitialized, isOnboardingComplete } = useStore();
    const autoAdvanceTimeoutRef = useRef(null);
    const lastAutoAdvanceStep = useRef(null);

    // Ensure all steps are properly initialized when component mounts
    useEffect(() => {
        ensureAllStepsInitialized();
    }, []);

    const tabs = [
        { id: 0, title: 'Basic Information', path: 'basic-information', required: true },
        { id: 1, title: 'Labour Information', path: 'labour-information', required: true },
        { id: 2, title: 'Food Cost Details', path: 'food-cost-details', required: true },
        { id: 3, title: 'Sales Channels', path: 'sales-channels', required: true },
        { id: 4, title: 'Expense', path: 'expense', required: true },
    ];

    // Map URL paths to tab IDs
    const pathToTabId = {
        'basic-information': 0,
        'labour-information': 1,
        'food-cost-details': 2,
        'sales-channels': 3,
        'expense': 4,
    };

    // Check if a step is completed
    const isStepCompleted = (stepName) => {
        const stepData = completeOnboardingData[stepName];
        const completed = stepData?.status === true;
        
        console.log(`🔍 Checking step "${stepName}":`, {
            stepData,
            status: stepData?.status,
            statusType: typeof stepData?.status,
            completed,
            hasData: !!stepData
        });
        
        if (completed) {
            console.log(`✅ Step "${stepName}" is completed. Restaurant ID: ${getRestaurantId()}`);
        } else {
            console.log(`❌ Step "${stepName}" is NOT completed`);
        }
        
        return completed;
    };

    // Check if user can navigate to a specific tab
    const canNavigateToTab = (targetTabId) => {
        // Always allow navigation to Basic Information (tab 0)
        if (targetTabId === 0) return true;

        // Check if Basic Information is completed
        const basicInfoCompleted = isStepCompleted('Basic Information');
        
        if (!basicInfoCompleted) {
            message.error('Please complete Basic Information before proceeding to other steps.');
            return false;
        }

        // For other steps, check if previous steps are completed
        const requiredSteps = tabs.slice(0, targetTabId).filter(tab => tab.required);
        
        for (const step of requiredSteps) {
            const stepName = step.title;
            if (!isStepCompleted(stepName)) {
                message.error(`Please complete ${stepName} before proceeding.`);
                return false;
            }
        }

        return true;
    };

    // Get step completion status for UI
    const getStepStatus = (tabId) => {
        const tab = tabs[tabId];
        if (!tab) return { completed: false, accessible: false };

        const completed = isStepCompleted(tab.title);
        const accessible = canNavigateToTab(tabId);

        return { completed, accessible };
    };

    // Get the next incomplete step
    const getNextIncompleteStep = () => {
        // First, check if all onboarding steps are completed
        const completionStatus = isOnboardingComplete();
        
        if (completionStatus.isComplete) {
            console.log('🎉 All onboarding steps are completed! Redirecting to dashboard...');
            navigate('/dashboard', { replace: true });
            return 0; // Return 0 as fallback, but navigation will happen
        }
        
        // Check if there are any steps with data at all
        const hasAnyStepData = Object.values(completeOnboardingData).some(step => 
            step && typeof step === 'object' && step.status !== undefined
        );
        
        if (!hasAnyStepData) {
            console.log('📭 No onboarding data found - user should start with Basic Information');
            return 0; // Return 0 to start with Basic Information step
        }
        
        for (let i = 0; i < tabs.length; i++) {
            const tab = tabs[i];
            if (!isStepCompleted(tab.title)) {
                return i;
            }
        }
        return 0; // Default to first step if all are completed
    };

    // Navigate to the next incomplete step
    const navigateToNextIncompleteStep = () => {
        const nextStepId = getNextIncompleteStep();
        handleTabClick(nextStepId);
    };

    // Auto-advance to next step if current step is completed
    const autoAdvanceIfCompleted = () => {
        // First, check if all onboarding steps are completed
        const completionStatus = isOnboardingComplete();
        
        if (completionStatus.isComplete) {
            console.log('🎉 All onboarding steps are completed! Redirecting to dashboard...');
            navigate('/dashboard', { replace: true });
            return;
        }
        
        const currentTab = tabs[activeTab];
        if (currentTab && isStepCompleted(currentTab.title)) {
            const nextTabId = activeTab + 1;
            if (nextTabId < tabs.length) {
                // Auto-advance to next step after a short delay
                setTimeout(() => {
                    handleTabClick(nextTabId);
                }, 500);
            }
        }
    };

    // Monitor step completion changes and auto-advance
    useEffect(() => {
        // First, check if all onboarding steps are completed
        const completionStatus = isOnboardingComplete();
        
        if (completionStatus.isComplete) {
            console.log('🎉 All onboarding steps are completed! Redirecting to dashboard...');
            
            // Clear any existing timeouts
            if (autoAdvanceTimeoutRef.current) {
                clearTimeout(autoAdvanceTimeoutRef.current);
            }
            
            // Redirect to dashboard after a short delay
            autoAdvanceTimeoutRef.current = setTimeout(() => {
                navigate('/dashboard', { replace: true });
            }, 1000);
            
            return; // Don't proceed with auto-advance logic
        }
        
        // If not all steps are completed, continue with normal auto-advance logic
        const currentTab = tabs[activeTab];
        if (currentTab && isStepCompleted(currentTab.title)) {
            const nextTabId = activeTab + 1;
            if (nextTabId < tabs.length && lastAutoAdvanceStep.current !== nextTabId) {
                // Clear any existing timeout
                if (autoAdvanceTimeoutRef.current) {
                    clearTimeout(autoAdvanceTimeoutRef.current);
                }
                
                // Prevent multiple auto-advances to the same step
                lastAutoAdvanceStep.current = nextTabId;
                
                // Auto-advance to next step after a short delay
                autoAdvanceTimeoutRef.current = setTimeout(() => {
                    handleTabClick(nextTabId);
                }, 500);
            }
        }
    }, [completeOnboardingData, activeTab, isOnboardingComplete, navigate]);

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            if (autoAdvanceTimeoutRef.current) {
                clearTimeout(autoAdvanceTimeoutRef.current);
            }
        };
    }, []);

    // Update active tab based on URL
    useEffect(() => {
        const pathname = location.pathname;
        const pathSegments = pathname.split('/');
        const lastSegment = pathSegments[pathSegments.length - 1];
        
        // First, check if all onboarding steps are completed
        const completionStatus = isOnboardingComplete();
        
        if (completionStatus.isComplete) {
            console.log('🎉 All onboarding steps are completed! Redirecting to dashboard...');
            navigate('/dashboard', { replace: true });
            return;
        }
        
        if (pathToTabId[lastSegment] !== undefined) {
            const targetTabId = pathToTabId[lastSegment];
            
            // Check if user can navigate to this tab
            if (canNavigateToTab(targetTabId)) {
                setActiveTab(targetTabId);
                
                // Check if current step is completed, then auto-advance to next step
                const currentTab = tabs[targetTabId];
                if (currentTab && isStepCompleted(currentTab.title)) {
                    const nextTabId = targetTabId + 1;
                    if (nextTabId < tabs.length && lastAutoAdvanceStep.current !== nextTabId) {
                        // Clear any existing timeout
                        if (autoAdvanceTimeoutRef.current) {
                            clearTimeout(autoAdvanceTimeoutRef.current);
                        }
                        
                        // Prevent multiple auto-advances to the same step
                        lastAutoAdvanceStep.current = nextTabId;
                        
                        // Auto-advance to next step after a short delay
                        autoAdvanceTimeoutRef.current = setTimeout(() => {
                            handleTabClick(nextTabId);
                        }, 500);
                    }
                }
            } else {
                // Redirect to Basic Information if not accessible
                setActiveTab(0);
                navigate('/onboarding/basic-information', { replace: true });
            }
        } else if (pathname.includes('/onboarding')) {
            // Default to basic information if no specific tab in URL
            setActiveTab(0);
            navigate('/onboarding/basic-information', { replace: true });
        }
    }, [location.pathname, navigate, completeOnboardingData, isOnboardingComplete]);

    const handleTabClick = (tabId) => {
        // Check if user can navigate to this tab
        if (!canNavigateToTab(tabId)) {
            return;
        }

        setActiveTab(tabId);
        const tab = tabs.find(t => t.id === tabId);
        if (tab) {
            navigate(`/onboarding/${tab.path}`);
        }
    };

    // Navigate to next step (used by Save & Continue buttons)
    const navigateToNextStep = () => {
        // First, check if all onboarding steps are completed
        const completionStatus = isOnboardingComplete();
        
        if (completionStatus.isComplete) {
            console.log('🎉 All onboarding steps are completed! Redirecting to dashboard...');
            message.success('All onboarding steps completed successfully! Welcome to your dashboard.');
            navigate('/dashboard', { replace: true });
            return;
        }
        
        const nextTabId = activeTab + 1;
        
        if (nextTabId < tabs.length) {
            if (canNavigateToTab(nextTabId)) {
                handleTabClick(nextTabId);
            }
        } else {
            // All steps completed - navigate to dashboard
            message.success('All onboarding steps completed successfully!');
            navigate('/dashboard', { replace: true });
        }
    };

    // Navigate to previous step
    const navigateToPreviousStep = () => {
        const prevTabId = activeTab - 1;
        
        if (prevTabId >= 0) {
            // Reset the current step's status to false when going back
            const currentTab = tabs[activeTab];
            if (currentTab) {
                resetStepStatus(currentTab.title);
            }
            
            handleTabClick(prevTabId);
        }
    };

    // Render different content based on active tab
    const renderActiveContent = () => {
        switch (activeTab) {
            case 0:
                return <RestaurantWrapper />;
            case 1:
                return <LaborInformationWrapper />;
            case 2:
                return <FoodCostWrapper />;
            case 3:
                return <SalesChannelsWrapper />;
            case 4:
                return <ExpenseWrapper />;
            default:
                return <RestaurantWrapper />;
        }
    };

    const value = {
        activeTab,
        tabs,
        handleTabClick,
        renderActiveContent,
        navigateToNextStep,
        navigateToPreviousStep,
        canNavigateToTab,
        getStepStatus,
        isStepCompleted,
        navigateToNextIncompleteStep,
        autoAdvanceIfCompleted
    };

    return (
        <TabContext.Provider value={value}>
            {children}
        </TabContext.Provider>
    );
}; 