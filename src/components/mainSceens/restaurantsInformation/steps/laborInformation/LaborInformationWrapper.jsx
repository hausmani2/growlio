import { useState, useEffect } from "react";
import { message } from "antd";
import LaborInformation from "./LaborInformation";
import LaborEntryMethod from "./LaborEntryMethod";
import { TabProvider } from "../../TabContext";
import useStore from "../../../../../store/store";
import useStepValidation from "../useStepValidation";

const LaborInformationWrapper = () => {
    const { submitStepData, loading, error, clearError, completeOnboardingData } = useStore();
    const { validationErrors, clearFieldError, validateLabourInformation } = useStepValidation();
    
    const [laborData, setLaborData] = useState({
        goal: '',
        needs_attention: '',
        danger: '',
        avg_hourly_rate: '',
        labor_record_method: 'daily_hours_costs',
        daily_ticket_count: '',
        forward_prev_week_rate: ''
    });

    // Load saved data when component mounts or when completeOnboardingData changes
    useEffect(() => {
        const labourInfoData = completeOnboardingData["Labour Information"];
        if (labourInfoData && labourInfoData.data) {
            const data = labourInfoData.data;
            
            setLaborData(prev => ({
                ...prev,
                goal: data.goal?.toString() || '',
                needs_attention: data.needs_attention?.toString() || '',
                danger: data.danger?.toString() || '',
                avg_hourly_rate: data.avg_hourly_rate?.toString() || '',
                labor_record_method: data.labor_record_method || 'daily_hours_costs',
                daily_ticket_count: data.daily_ticket_count ? "2" : "1",
                forward_prev_week_rate: data.forward_prev_week_rate ? "2" : "1"
            }));
        }
    }, [completeOnboardingData]);

    // Clear error when component mounts
    useEffect(() => {
        clearError();
    }, [clearError]);

    // Show error message when there's an error
    useEffect(() => {
        if (error) {
            message.error(error);
        }
    }, [error]);

    const updateLaborData = (field, value) => {
        setLaborData(prev => ({
            ...prev,
            [field]: value
        }));
        clearFieldError(field);
    };

    // Function to handle save and continue
    const handleSaveAndContinue = async () => {
        try {
            console.log("=== Labour Information Save & Continue ===");
            console.log("Current laborData:", laborData);
            
            // Step 1: Validate form
            const validationResult = validateLabourInformation(laborData);
            console.log("Validation result:", validationResult);
            console.log("Validation passed:", Object.keys(validationResult).length === 0);
            
            if (!validationResult || Object.keys(validationResult).length > 0) {
                console.log("Validation failed with errors:", validationResult);
                message.error("Please fill in all required fields correctly");
                return { success: false, error: "Validation failed" };
            }

            // Step 2: Prepare data for API
            const stepData = {
                goal: laborData.goal,
                needs_attention: laborData.needs_attention,
                danger: laborData.danger,
                avg_hourly_rate: parseFloat(laborData.avg_hourly_rate) || 0,
                labor_record_method: laborData.labor_record_method,
                daily_ticket_count: laborData.daily_ticket_count === "2",
                forward_prev_week_rate: laborData.forward_prev_week_rate === "2"
            };
            
            console.log("Prepared stepData for API:", stepData);
            
            // Step 3: Call API through Zustand store
            console.log("Calling submitStepData...");
            const result = await submitStepData("Labour Information", stepData);
            console.log("submitStepData result:", result);
            
            // Step 4: Handle success
            if (result.success) {
                message.success("Labor information saved successfully!");
                console.log("Labor information saved successfully, ready for next step");
                
                // Check if restaurant_id was returned and log it
                if (result.data && result.data.restaurant_id) {
                    console.log("✅ Restaurant ID received:", result.data.restaurant_id);
                }
                
                return { success: true, data: result.data };
            } else {
                message.error("Failed to save labor information. Please try again.");
                return { success: false, error: "API call failed" };
            }
        } catch (error) {
            console.error("Error saving labor information:", error);
            
            // Show user-friendly error message
            const errorMessage = error.message || "An unexpected error occurred. Please try again.";
            message.error(errorMessage);
            
            return { success: false, error: errorMessage };
        }
    };

    return (
        <TabProvider>
            <div className="flex flex-col">
                <LaborInformation 
                    data={laborData} 
                    updateData={updateLaborData}
                    errors={validationErrors}
                />    
                <LaborEntryMethod 
                    data={laborData} 
                    updateData={updateLaborData}
                    errors={validationErrors}
                    onSaveAndContinue={handleSaveAndContinue}
                    loading={loading}
                />
            </div>
        </TabProvider>
    );
};   

export default LaborInformationWrapper;