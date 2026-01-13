import React, { useEffect } from 'react';
import useStepNavigation from './hooks/useStepNavigation';

const StepDataManager = ({ stepName, children }) => {
    const { getCurrentStepData } = useStepNavigation();

    // Load step data when component mounts
    useEffect(() => {
            getCurrentStepData(stepName);
        
    }, [stepName, getCurrentStepData]);

    return (
        <div className="step-data-manager">
            {children}
        </div>
    );
};

export default StepDataManager; 