import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { message } from 'antd';
import RestaurantWrapper from './steps/basicInformation/RestaurantWrapper';
import FoodCostWrapper from './steps/foodCostDetails/FoodCostWrapper';
import LaborInformationWrapper from './steps/laborInformation/LaborInformationWrapper';
import { TabContext } from './context/TabContext';
import SalesChannelsWrapper from './steps/salesChannels/SalesChannelsWrapper';
import ExpenseWrapper from './steps/Expense/ExpenseWrapper';
import useStore from '../../../store/store';
import useStepNavigation from './hooks/useStepNavigation';

export const TabProvider = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState(0);
    const { 
        completeOnboardingData, 
        resetStepStatus, 
        getRestaurantId, 
        ensureAllStepsInitialized,
        loadExistingOnboardingData,
        checkOnboardingCompletion,
        onboardingLoading: loading
    } = useStore();
    const { loadStepData, saveCurrentStepData } = useStepNavigation();

    // Check if we need to load existing onboarding data
    const shouldLoadExistingData = () => {
        const hasAnyCompletedSteps = Object.values(completeOnboardingData).some(step => 
            step && typeof step === 'object' && step.status === true
        );
        
        const hasRestaurantId = completeOnboardingData.restaurant_id || localStorage.getItem('restaurant_id');
        
        // If we have a restaurant_id but no completed steps, we should load data
        if (hasRestaurantId && !hasAnyCompletedSteps) {
            return true;
        }
        
        return false;
    };

    // Load existing onboarding data if needed
    const loadExistingDataIfNeeded = async () => {
        if (shouldLoadExistingData()) {
            try {
                const result = await loadExistingOnboardingData();
                if (result.success) {
                    message.success('Loaded your existing setup data');
                } else {
                }
            } catch (error) {
                console.error('❌ Error loading existing data:', error);
            }
        }
    };

    // Ensure all steps are properly initialized when component mounts
    useEffect(() => {
        ensureAllStepsInitialized();
        loadExistingDataIfNeeded();
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
        
        
        if (completed) {
        } else {
        }
        
        return completed;
    };

    // Check if user can navigate to a specific tab
    const canNavigateToTab = (targetTabId, showMessage = true) => {
        
        // Always allow navigation to Basic Information (tab 0)
        if (targetTabId === 0) { 
            return true;
        }

        // Check if Basic Information is completed
        const basicInfoCompleted = isStepCompleted('Basic Information');
        
        if (!basicInfoCompleted) {
            if (showMessage) {
                message.error('Please complete Basic Information before proceeding to other steps.');
            }
            return false;
        }

        // For other steps, check if ALL previous steps are completed (not including the target step)
        const requiredSteps = tabs.slice(0, targetTabId).filter(tab => tab.required);
        
        for (const step of requiredSteps) {
            const stepName = step.title;
            const stepCompleted = isStepCompleted(stepName);
            
            if (!stepCompleted) {
                if (showMessage) {
                    message.error(`Please complete ${stepName} before proceeding.`);
                }
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
        const accessible = canNavigateToTab(tabId, false); // Don't show messages for UI status checks

        return { completed, accessible };
    };

    // Get the next incomplete step
    const getNextIncompleteStep = () => {
        // Check if there are any steps with data at all
        const hasAnyStepData = Object.values(completeOnboardingData).some(step => 
            step && typeof step === 'object' && step.status !== undefined
        );
        
        
        if (!hasAnyStepData) {
            return 0; // Return 0 to start with Basic Information step
        }
        
        for (let i = 0; i < tabs.length; i++) {
            const tab = tabs[i];
            const isCompleted = isStepCompleted(tab.title);

            if (!isCompleted) {
                return i;
            }
        }
        
        // If all steps are completed locally, return the last step index
        return tabs.length - 1; // Return last step index instead of navigating
    };

    // Navigate to the next incomplete step
    const navigateToNextIncompleteStep = () => {
        const nextStepId = getNextIncompleteStep();
        handleTabClick(nextStepId);
    };

    // Auto-advance function removed to prevent unwanted navigation
    // const autoAdvanceIfCompleted = () => {
    //     // Auto-advance logic removed
    // };

    // Monitor step completion changes - REMOVED AUTO-ADVANCE LOGIC
    // useEffect(() => {
    //     // Auto-advance logic removed to prevent unwanted navigation
    // }, [completeOnboardingData, activeTab, navigate]);

    // Cleanup timeouts on unmount - REMOVED since no auto-advance timeouts
    // useEffect(() => {
    //     return () => {
    //         if (autoAdvanceTimeoutRef.current) {
    //             clearTimeout(autoAdvanceTimeoutRef.current);
    //         }
    //     };
    // }, []);

    // Update active tab based on URL
    useEffect(() => {
        const pathname = location.pathname;
        const pathSegments = pathname.split('/');
        const lastSegment = pathSegments[pathSegments.length - 1];
        
        if (pathToTabId[lastSegment] !== undefined) {
            const targetTabId = pathToTabId[lastSegment];
            
            // Check if user can navigate to this tab (don't show messages for URL-based navigation)
            if (canNavigateToTab(targetTabId, false)) {
                setActiveTab(targetTabId);
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
    }, [location.pathname, navigate, completeOnboardingData]);

    const handleTabClick = (tabId) => {
        
        // Check if user can navigate to this tab (show message for explicit user clicks)
        if (!canNavigateToTab(tabId, true)) {
            return; // Don't proceed if navigation is not allowed
        }

        // Load saved data into temporary form data for the target step
        const targetTab = tabs.find(t => t.id === tabId);
        if (targetTab) {
            loadStepData(targetTab.title);
        }

        setActiveTab(tabId);
        
        const tab = tabs.find(t => t.id === tabId);
        if (tab) {
            const targetPath = `/onboarding/${tab.path}`;
            navigate(targetPath);
        } else {
            console.error(`❌ Tab not found for id: ${tabId}`);
        }
    };

    // Navigate to next step (used by Save & Continue buttons)
    const navigateToNextStep = async (skipCompletionCheck = false) => {
        const nextTabId = activeTab + 1;
        
        // Debug: Check current state before navigation
        
        if (nextTabId < tabs.length) {
            
            if (skipCompletionCheck) {
                // Skip completion check when called from successful save operation
                const targetTab = tabs.find(t => t.id === nextTabId);
                if (targetTab) {
                    loadStepData(targetTab.title);
                }
                
                setActiveTab(nextTabId);
                
                const tab = tabs.find(t => t.id === nextTabId);
                if (tab) {
                    const targetPath = `/onboarding/${tab.path}`;
                    navigate(targetPath);
                } else {
                    console.error(`❌ Tab not found for id: ${nextTabId}`);
                }
            } else {
                // Check completion status for manual navigation
                handleTabClick(nextTabId);
            }
        } else {
            // All local steps completed - check if onboarding is actually complete
            
            try {
                const completionResult = await checkOnboardingCompletion();
                
                if (completionResult.success && completionResult.isComplete) {
                    message.success('Congratulations! Your onboarding is complete!');
                    completeOnboarding();
                } else {
                    message.info('All steps completed! Please wait for final confirmation.');
                }
            } catch (error) {
                console.error('❌ Error checking onboarding completion:', error);
                message.warning('All steps completed! Please check your onboarding status.');
            }
        }
    };

    // Navigate to previous step
    const navigateToPreviousStep = () => {
        const prevTabId = activeTab - 1;
        
        if (prevTabId >= 0) {
            // Save current step's temporary form data before going back
            const currentTab = tabs[activeTab];
            if (currentTab) {
                const currentStepName = currentTab.title;
                saveCurrentStepData(currentStepName);
                
                // Don't reset step status when going back to preserve restaurant_id
                // resetStepStatus(currentStepName);
            }
            
            handleTabClick(prevTabId);
        }
    };

    // Complete onboarding (explicitly called by user)
    const completeOnboarding = () => {
        console.log('🎉 User explicitly completing onboarding! Navigating to completion page...');
        message.success('Finalizing your setup...');
        navigate('/onboarding/complete', { replace: true });
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
        completeOnboarding
    };

    return (
        <TabContext.Provider value={value}>
            {children}
        </TabContext.Provider>
    );
}; 