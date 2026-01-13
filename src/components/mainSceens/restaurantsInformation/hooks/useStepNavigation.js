import { useCallback } from 'react';
import useStore from '../../../../store/store';

const useStepNavigation = () => {
    const { 
        saveTempFormData, 
        loadDataToTempForm, 
        // resetStepStatus,
        getTempFormData 
    } = useStore();

    // Save current step data before navigating
    const saveCurrentStepData = useCallback((stepName) => {
        saveTempFormData(stepName);
    }, [saveTempFormData]);

    // Load step data when navigating to a step
    const loadStepData = useCallback((stepName) => {
        loadDataToTempForm(stepName);
    }, [loadDataToTempForm]);

    // Navigate to next step with data saving
    const navigateToNextStep = useCallback((currentStepName, nextStepName) => {
        // Save current step data
        saveCurrentStepData(currentStepName);
        
        // Load next step data
        loadStepData(nextStepName);
        
    }, [saveCurrentStepData, loadStepData]);

    // Navigate to previous step with data saving
    const navigateToPreviousStep = useCallback((currentStepName, previousStepName) => {
        // Save current step data
        saveCurrentStepData(currentStepName);
        
        // Don't reset step status when going back to preserve restaurant_id
        // resetStepStatus(currentStepName);
        
        // Load previous step data
        loadStepData(previousStepName);
        
    }, [saveCurrentStepData, loadStepData]);

    // Get current step data
    const getCurrentStepData = useCallback((stepName) => {
        return getTempFormData(stepName);
    }, [getTempFormData]);

    return {
        saveCurrentStepData,
        loadStepData,
        navigateToNextStep,
        navigateToPreviousStep,
        getCurrentStepData
    };
};

export default useStepNavigation; 