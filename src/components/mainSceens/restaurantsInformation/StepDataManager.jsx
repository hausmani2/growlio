import React, { useEffect } from 'react';
import useStore from '../../../store/store';
import useStepNavigation from './hooks/useStepNavigation';

const StepDataManager = ({ stepName, children }) => {
    const { getCurrentStepData } = useStepNavigation();
    const { getTempFormData } = useStore();

    // Load step data when component mounts
    useEffect(() => {
        const stepData = getCurrentStepData(stepName);
        console.log(`📊 Step data for ${stepName}:`, stepData);
    }, [stepName, getCurrentStepData]);

    return (
        <div className="step-data-manager">
            {children}
        </div>
    );
};

export default StepDataManager; 