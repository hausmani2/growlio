
import React, { useState, useCallback, useEffect } from "react";
import { message } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import FixedCost from "./FixedCost";
import VariableFixed from "./VariableFixed";
import TotalExpense from "./TotalExpense";
import { TabProvider } from "../../TabContext";
import { useTabHook } from "../../useTabHook";
import useStore from "../../../../../store/store";
import useStepValidation from "../useStepValidation";

const ExpenseWrapperContent = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { submitStepData, onboardingLoading: loading, onboardingError: error, clearError, completeOnboardingData, checkOnboardingCompletion } = useStore();
    const { validationErrors, clearFieldError, validateExpense } = useStepValidation();
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
        console.log("=== LOADING EXPENSE DATA ===");
        console.log("completeOnboardingData:", completeOnboardingData);
        
        const expenseInfoData = completeOnboardingData["Expense"];
        console.log("expenseInfoData:", expenseInfoData);
        
        if (expenseInfoData && expenseInfoData.data) {
            const data = expenseInfoData.data;
            console.log("Expense data from API:", data);
            
            // Load fixed costs
            if (data.fixed_costs && Array.isArray(data.fixed_costs)) {
                console.log("Loading fixed_costs:", data.fixed_costs);
                const dynamicFixedCosts = data.fixed_costs.map(cost => ({
                    id: Date.now() + Math.random(),
                    label: cost.name,
                    value: cost.amount.toString(),
                    key: `dynamic_fixed_${Date.now()}_${Math.random()}`
                }));
                
                if (dynamicFixedCosts.length > 0) {
                    console.log("Setting dynamicFixedFields:", dynamicFixedCosts);
                    setExpenseData(prev => ({ ...prev, dynamicFixedFields: dynamicFixedCosts }));
                }
            }
            
            // Load variable costs
            if (data.variable_costs && Array.isArray(data.variable_costs)) {
                console.log("Loading variable_costs:", data.variable_costs);
                const dynamicVariableCosts = data.variable_costs.map(cost => ({
                    id: Date.now() + Math.random(),
                    label: cost.name,
                    value: cost.amount.toString(),
                    key: `dynamic_variable_${Date.now()}_${Math.random()}`
                }));
                
                if (dynamicVariableCosts.length > 0) {
                    console.log("Setting dynamicVariableFields:", dynamicVariableCosts);
                    setExpenseData(prev => ({ ...prev, dynamicVariableFields: dynamicVariableCosts }));
                }
            }
        } else {
            console.log("No expense data found in completeOnboardingData");
            console.log("Available keys:", Object.keys(completeOnboardingData));
        }
        console.log("=============================");
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

        setApiExpenseData({
            fixed_costs: dynamicFixedCosts,
            variable_costs: dynamicVariableCosts
        });
    }, [expenseData]);

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
        clearFieldError(field);
    }, [clearFieldError]);

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
            // Step 1: Custom validation
            const customErrors = validateExpenseData(apiExpenseData);
            if (Object.keys(customErrors).length > 0) {
                if (customErrors.no_fields) {
                    message.error(customErrors.no_fields);
                } else {
                    message.error("Please fill in all required fields correctly");
                }
                return { success: false, error: "Validation failed" };
            }

            // Step 2: Standard validation
            if (!validateExpense(apiExpenseData)) {
                message.error("Please fill in all required fields correctly");
                return { success: false, error: "Validation failed" };
            }

            // Step 3: Prepare data for API
            const stepData = {
                fixed_costs: apiExpenseData.fixed_costs,
                variable_costs: apiExpenseData.variable_costs
            };
            
            console.log("Submitting Expense data:", stepData);
            
            // Step 4: Call API through Zustand store with success callback
            const result = await submitStepData("Expense", stepData, async (responseData) => {
                // Success callback - handle navigation based on mode
                console.log("✅ Expense saved successfully");
                
                // Log detailed expense summary
                console.log("=== EXPENSE DATA SAVED ===");
                console.log("📊 Fixed Costs:");
                apiExpenseData.fixed_costs.forEach(cost => {
                    console.log(`  • ${cost.name}: $${cost.amount.toFixed(2)}`);
                });
                
                console.log("\n📈 Variable Costs:");
                apiExpenseData.variable_costs.forEach(cost => {
                    console.log(`  • ${cost.name}: $${cost.amount.toFixed(2)}`);
                });
                
                const totalFixed = apiExpenseData.fixed_costs.reduce((sum, cost) => sum + cost.amount, 0);
                const totalVariable = apiExpenseData.variable_costs.reduce((sum, cost) => sum + cost.amount, 0);
                const grandTotal = totalFixed + totalVariable;
                
                console.log(`\n💰 Total Fixed: $${totalFixed.toFixed(2)}`);
                console.log(`💰 Total Variable: $${totalVariable.toFixed(2)}`);
                console.log(`💰 Grand Total: $${grandTotal.toFixed(2)}`);
                console.log("================================");
                
                // Check if restaurant_id was returned and log it
                if (responseData && responseData.restaurant_id) {
                    console.log("✅ Restaurant ID received:", responseData.restaurant_id);
                }

                // Step 5: Handle navigation based on mode
                if (isUpdateMode) {
                    // In update mode, stay on the same page or go to dashboard
                    console.log("🔄 Update mode - staying on current page");
                    message.success("Expense information updated successfully!");
                } else {
                    // In onboarding mode, check if onboarding is complete
                    console.log("🔄 Onboarding mode - checking completion status");
                    message.success("Expense information saved successfully!");
                    
                    try {
                        console.log("🔄 Checking if onboarding is complete...");
                        const completionResult = await checkOnboardingCompletion();
                        
                        if (completionResult.success && completionResult.isComplete) {
                            console.log("🎉 Onboarding is complete! Navigating to completion page...");
                            message.success("Congratulations! Your onboarding is complete!");
                            
                            // Navigate to completion page
                            completeOnboarding();
                        } else {
                            console.log("⚠️ Onboarding not yet complete, staying on current step");
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
            
            // Step 5: Handle success
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
            
            <div className="flex justify-between mt-6">
                {isUpdateMode && (
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                        Back to Dashboard
                    </button>
                )}
                {isUpdateMode && (
                    <button
                        onClick={handleSave}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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