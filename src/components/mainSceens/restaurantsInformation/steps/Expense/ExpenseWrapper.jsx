
import React, { useState, useCallback, useEffect } from "react";
import { message } from "antd";
import { useLocation } from "react-router-dom";
import FixedCost from "./FixedCost";
import VariableFixed from "./VariableFixed";
import TotalExpense from "./TotalExpense";
import { TabProvider } from "../../TabContext";
import { useTabHook } from "../../useTabHook";
import useStore from "../../../../../store/store";
import useStepValidation from "../useStepValidation";

const ExpenseWrapperContent = () => {
    const location = useLocation();
    const { submitStepData, onboardingLoading: loading, onboardingError: error, clearError, completeOnboardingData, checkOnboardingCompletion } = useStore();
    const { validationErrors, clearFieldError, validateExpense, setValidationErrors, clearAllErrors } = useStepValidation();
    const { navigateToNextStep, completeOnboarding } = useTabHook();
    
    // Check if this is update mode (accessed from sidebar) or onboarding mode
    const isUpdateMode = !location.pathname.includes('/onboarding');
    
    // State for expense data - only dynamic fields
    const [expenseData, setExpenseData] = useState({
        totalFixedCost: "0.00",
        totalVariableCost: "0.00",
        
        // Dynamic fields
        dynamicFixedFields: [],
        dynamicVariableFields: []
    });

    // API-ready expense data
    const [apiExpenseData, setApiExpenseData] = useState({
        fixed_costs: [],
        variable_costs: []
    });

    // Load saved data when component mounts or when completeOnboardingData changes
    useEffect(() => {
        const expenseInfoData = completeOnboardingData["Expense"];
        
        if (expenseInfoData && expenseInfoData.data) {
            const data = expenseInfoData.data;
            
            // Load fixed costs
            if (data.fixed_costs && Array.isArray(data.fixed_costs)) {
                const dynamicFixedCosts = data.fixed_costs.map(cost => ({
                    id: Date.now() + Math.random(),
                    label: cost.name,
                    value: cost.amount.toString(),
                    key: `dynamic_fixed_${Date.now()}_${Math.random()}`
                }));
                
                if (dynamicFixedCosts.length > 0) {
                    setExpenseData(prev => ({ ...prev, dynamicFixedFields: dynamicFixedCosts }));
                }
            }
            
            // Load variable costs
            if (data.variable_costs && Array.isArray(data.variable_costs)) {
                const dynamicVariableCosts = data.variable_costs.map(cost => ({
                    id: Date.now() + Math.random(),
                    label: cost.name,
                    value: cost.amount.toString(),
                    key: `dynamic_variable_${Date.now()}_${Math.random()}`
                }));
                
                if (dynamicVariableCosts.length > 0) {
                    setExpenseData(prev => ({ ...prev, dynamicVariableFields: dynamicVariableCosts }));
                }
            }
        } else {
            console.log("No expense data found in completeOnboardingData");
            console.log("Available keys:", Object.keys(completeOnboardingData));
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

    // Update API-ready data when expense data changes
    useEffect(() => {
        // Dynamic fixed costs
        const dynamicFixedCosts = expenseData.dynamicFixedFields
            .filter(field => parseFloat(field.value) > 0)
            .map(field => ({
                name: field.label,
                amount: parseFloat(field.value)
            }));

        // Dynamic variable costs
        const dynamicVariableCosts = expenseData.dynamicVariableFields
            .filter(field => parseFloat(field.value) > 0)
            .map(field => ({
                name: field.label,
                amount: parseFloat(field.value)
            }));

        const newApiData = {
            fixed_costs: dynamicFixedCosts,
            variable_costs: dynamicVariableCosts
        };

        // Only update if the data has actually changed
        const currentDataString = JSON.stringify(apiExpenseData);
        const newDataString = JSON.stringify(newApiData);
        
        if (currentDataString !== newDataString) {
            setApiExpenseData(newApiData);
        }
    }, [expenseData, apiExpenseData]);

    const updateExpenseData = useCallback((field, value) => {
        setExpenseData(prev => {
            // Only update if the value has actually changed
            if (prev[field] === value) {
                return prev;
            }
            return {
                ...prev,
                [field]: value
            };
        });
        // Clear validation error for this field when user starts typing
        if (validationErrors[field]) {
            clearFieldError(field);
        }
    }, [clearFieldError, validationErrors]);

    // Custom validation for expense data
    const validateExpenseData = (data) => {
        const errors = {};
        
        // Check if at least one field is added in either fixed or variable costs
        const hasFixedCosts = data.fixed_costs && data.fixed_costs.length > 0;
        const hasVariableCosts = data.variable_costs && data.variable_costs.length > 0;
        
        if (!hasFixedCosts && !hasVariableCosts) {
            errors.no_fields = "Please add at least one expense field before saving";
            return errors;
        }

        // Validate each field has a name and valid amount
        if (data.fixed_costs && data.fixed_costs.length > 0) {
            data.fixed_costs.forEach((cost, index) => {
                if (!cost.name?.trim()) {
                    errors[`fixed_cost_${index}_name`] = "Cost name is required";
                }
                if (!cost.amount || isNaN(cost.amount) || parseFloat(cost.amount) <= 0) {
                    errors[`fixed_cost_${index}_amount`] = "Please enter a valid amount greater than 0";
                }
            });
        }

        if (data.variable_costs && data.variable_costs.length > 0) {
            data.variable_costs.forEach((cost, index) => {
                if (!cost.name?.trim()) {
                    errors[`variable_cost_${index}_name`] = "Cost name is required";
                }
                if (!cost.amount || isNaN(cost.amount) || parseFloat(cost.amount) <= 0) {
                    errors[`variable_cost_${index}_amount`] = "Please enter a valid amount greater than 0";
                }
            });
        }

        return errors;
    };

    // Handle save functionality
    const handleSave = async () => {
        try {
            // Step 1: Prepare comprehensive data for validation
            const validationData = {
                ...apiExpenseData,
                dynamicFixedFields: expenseData.dynamicFixedFields,
                dynamicVariableFields: expenseData.dynamicVariableFields,
                totalFixedCost: expenseData.totalFixedCost,
                totalVariableCost: expenseData.totalVariableCost
            };
            
            // Step 2: Custom validation
            const customErrors = validateExpenseData(apiExpenseData);
            if (Object.keys(customErrors).length > 0) {
                if (customErrors.no_fields) {
                    message.error(customErrors.no_fields);
                } else {
                    message.error("Please fill in all required fields correctly");
                }
                return { success: false, error: "Validation failed" };
            }

            // Step 3: Standard validation
            const validationResult = validateExpense(validationData);
            
            if (!validationResult || Object.keys(validationResult).length > 0) {
                // Set validation errors in state so they display in UI
                setValidationErrors(validationResult);
                message.error("Please fill in all required fields correctly");
                return { success: false, error: "Validation failed" };
            }

            // Step 4: Prepare data for API
            const stepData = {
                fixed_costs: apiExpenseData.fixed_costs,
                variable_costs: apiExpenseData.variable_costs
            };
            
            // Step 5: Call API through Zustand store with success callback
            const result = await submitStepData("Expense", stepData, async (responseData) => {
                // Success callback - handle navigation based on mode
                
                // Clear all validation errors on successful save
                clearAllErrors();

                const totalFixed = apiExpenseData.fixed_costs.reduce((sum, cost) => sum + cost.amount, 0);
                const totalVariable = apiExpenseData.variable_costs.reduce((sum, cost) => sum + cost.amount, 0);
                const grandTotal = totalFixed + totalVariable;
                
                // Check if restaurant_id was returned and log it
                if (responseData && responseData.restaurant_id) {
                }

                // Step 6: Handle navigation based on mode
                if (isUpdateMode) {
                    // In update mode, stay on the same page or go to dashboard
                    message.success("Expense information updated successfully!");
                } else {
                    // In onboarding mode, check if onboarding is complete
                    message.success("Expense information saved successfully!");
                    
                    try {
                        const completionResult = await checkOnboardingCompletion();
                        
                        if (completionResult.success && completionResult.isComplete) {
                            message.success("Congratulations! Your onboarding is complete!");
                            
                            // Navigate to completion page
                            completeOnboarding();
                        } else {
                            message.info("Expense saved! Please complete remaining steps.");
                            
                            // Stay on current step or navigate to next incomplete step
                            navigateToNextStep();
                        }
                    } catch (error) {
                        console.error("❌ Error checking onboarding completion:", error);
                        message.warning("Expense saved! Please check your onboarding status.");
                        
                        // Fallback: navigate to completion page
                        completeOnboarding();
                    }
                }
            });
            
            // Step 7: Handle success
            if (result.success) {
                return { success: true };
            } else {
                message.error("Failed to save expense information. Please try again.");
                return { success: false, error: "API call failed" };
            }
        } catch (error) {
            console.error("Error saving expense data:", error);
            message.error("An error occurred while saving. Please try again.");
            return { success: false, error: error.message };
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {isUpdateMode && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">Update Mode</h3>
                    <p className="text-blue-700">
                        You are updating your expense information. Changes will be saved when you click "Save".
                    </p>
                </div>
            )}

            {/* Show prominent error message when no expenses are added */}
            {validationErrors.no_expenses && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h3 className="text-lg font-semibold text-red-800 mb-2">⚠️ Expense Required</h3>
                    <p className="text-red-700">
                        {validationErrors.no_expenses}
                    </p>
                </div>
            )}
            
            <FixedCost 
                data={expenseData} 
                updateData={updateExpenseData}
                errors={validationErrors}
            />
            <VariableFixed 
                data={expenseData} 
                updateData={updateExpenseData}
                errors={validationErrors}
            />
            <TotalExpense 
                data={expenseData} 
                onSave={handleSave}
                loading={loading}
            />
            
            <div className="flex justify-end mt-6">

                {isUpdateMode && (
                    <button
                        onClick={handleSave}
                        className="bg-orange-300 text-white px-6 py-2 rounded-lg hover:bg-orange-500 transition-colors"
                        disabled={loading}
                    >
                        {loading ? "Saving..." : "Save Changes"}
                    </button>
                )}
            </div>
        </div>
    );
};

const ExpenseWrapper = () => {
    return (
        <TabProvider>
            <ExpenseWrapperContent />
        </TabProvider>
    );
};

export default ExpenseWrapper;