import { useState, useEffect } from "react";
import { message } from "antd";
import SalesChannel from "./SalesChannel";
import { TabProvider } from "../../TabContext";
import useStore from "../../../../../store/store";
import useStepValidation from "../useStepValidation";

const SalesChannelsWrapper = () => {
    const { submitStepData, loading, error, clearError, completeOnboardingData } = useStore();
    const { validationErrors, clearFieldError, validateSalesChannels } = useStepValidation();
    
    // State for Sales Channels
    const [salesChannelsData, setSalesChannelsData] = useState({
        in_store: true,
        online: false,
        from_app: false,
        third_party: false
    });

    // Load saved data when component mounts or when completeOnboardingData changes
    useEffect(() => {
        const salesChannelsInfoData = completeOnboardingData["Sales Channels"];
        if (salesChannelsInfoData && salesChannelsInfoData.data) {
            const data = salesChannelsInfoData.data;
            
            setSalesChannelsData(prev => ({
                ...prev,
                in_store: data.in_store || true,
                online: data.online || false,
                from_app: data.from_app || false,
                third_party: data.third_party || false
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

    // Function to update sales channels data
    const updateSalesChannelsData = (field, value) => {
        setSalesChannelsData(prev => ({
            ...prev,
            [field]: value
        }));
        clearFieldError(field);
    };

    // Function to handle save and continue
    const handleSaveAndContinue = async () => {
        try {
            // Step 1: Validate form
            if (!validateSalesChannels(salesChannelsData)) {
                message.error("Please select at least one sales channel");
                return { success: false, error: "Validation failed" };
            }

            // Step 2: Prepare data for API
            const stepData = {
                in_store: salesChannelsData.in_store,
                online: salesChannelsData.online,
                from_app: salesChannelsData.from_app,
                third_party: salesChannelsData.third_party
            };
            
            console.log("Submitting Sales Channels data:", stepData);
            
            // Step 3: Call API through Zustand store
            const result = await submitStepData("Sales Channels", stepData);
            
            // Step 4: Handle success
            if (result.success) {
                message.success("Sales channels saved successfully!");
                console.log("Sales channels saved successfully, ready for next step");
                
                // Check if restaurant_id was returned and log it
                if (result.data && result.data.restaurant_id) {
                    console.log("✅ Restaurant ID received:", result.data.restaurant_id);
                }
                
                return { success: true, data: result.data };
            } else {
                message.error("Failed to save sales channels. Please try again.");
                return { success: false, error: "API call failed" };
            }
        } catch (error) {
            console.error("Error saving sales channels:", error);
            
            // Show user-friendly error message
            const errorMessage = error.message || "An unexpected error occurred. Please try again.";
            message.error(errorMessage);
            
            return { success: false, error: errorMessage };
        }
    };

    return (
        <TabProvider>
            <div className="flex flex-col">
                <SalesChannel 
                    data={salesChannelsData}
                    updateData={updateSalesChannelsData}
                    errors={validationErrors}
                    onSaveAndContinue={handleSaveAndContinue}
                    loading={loading}
                />
            </div>
        </TabProvider>
    );
};

export default SalesChannelsWrapper;