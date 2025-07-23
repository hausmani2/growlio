import { useCallback } from 'react';
import useStore from '../../../../store/store';

const useStepNavigation = () => {
    const { 
        saveTempFormData, 
        loadDataToTempForm, 
        resetStepStatus,
        getTempFormData 
    } = useStore();

    // Save current step data before navigating
    const saveCurrentStepData = useCallback((stepName) => {
        console.log(`💾 Saving temporary form data for ${stepName}`);
        saveTempFormData(stepName);
    }, [saveTempFormData]);

    // Load step data when navigating to a step
    const loadStepData = useCallback((stepName) => {
        console.log(`📂 Loading saved data for ${stepName}`);
        loadDataToTempForm(stepName);
    }, [loadDataToTempForm]);

    // Navigate to next step with data saving
    const navigateToNextStep = useCallback((currentStepName, nextStepName) => {
        // Save current step data
        saveCurrentStepData(currentStepName);
        
        // Load next step data
        loadStepData(nextStepName);
        
        console.log(`➡️ Navigated from ${currentStepName} to ${nextStepName}`);
    }, [saveCurrentStepData, loadStepData]);

    // Navigate to previous step with data saving
    const navigateToPreviousStep = useCallback((currentStepName, previousStepName) => {
        // Save current step data
        saveCurrentStepData(currentStepName);
        
        // Reset current step status
        resetStepStatus(currentStepName);
        
        // Load previous step data
        loadStepData(previousStepName);
        
        console.log(`⬅️ Navigated from ${currentStepName} to ${previousStepName}`);
    }, [saveCurrentStepData, resetStepStatus, loadStepData]);

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