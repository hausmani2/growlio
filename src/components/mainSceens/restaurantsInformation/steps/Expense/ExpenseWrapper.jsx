
import React, { useState, useCallback, useEffect, useRef } from "react";
import { message, Modal, Select } from "antd";
import { useLocation } from "react-router-dom";
import FixedCost from "./FixedCost";
import VariableFixed from "./VariableFixed";
import TotalExpense from "./TotalExpense";
import { TabProvider } from "../../TabContext";
import { useTabHook } from "../../useTabHook";
import useStore from "../../../../../store/store";
import useStepValidation from "../useStepValidation";
import LoadingSpinner from "../../../../layout/LoadingSpinner";
import OnboardingBreadcrumb from "../../../../common/OnboardingBreadcrumb";

const ExpenseWrapperContent = () => {
    const location = useLocation();
    const { submitStepData, onboardingLoading: loading, onboardingError: error, clearError, completeOnboardingData, checkOnboardingCompletion } = useStore();
    const { validationErrors, clearFieldError, validateExpense, setValidationErrors, clearAllErrors } = useStepValidation();
    const { navigateToNextStep, completeOnboarding } = useTabHook();

    // Ref for VariableFixed component to access percentage field filtering
    const variableFixedRef = useRef();

    // Check if this is update mode (accessed from sidebar) or onboarding mode
    const isUpdateMode = !location.pathname.includes('/onboarding');

    // Get is_franchise data from Basic Information
    const isFranchise = completeOnboardingData["Basic Information"]?.data?.locations?.[0]?.is_franchise || false;

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
        variable_costs: [],
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
                    key: `dynamic_fixed_${Date.now()}_${Math.random()}`,
                    fixed_expense_type: cost.fixed_expense_type || "monthly" // Default to monthly if not present
                }));

                if (dynamicFixedCosts.length > 0) {
                    // Calculate total fixed cost
                    const totalFixed = dynamicFixedCosts.reduce((sum, field) => {
                        return sum + parseFloat(field.value || 0);
                    }, 0);

                    setExpenseData(prev => ({
                        ...prev,
                        dynamicFixedFields: dynamicFixedCosts,
                        totalFixedCost: totalFixed.toFixed(2)
                    }));
                }
            }

            // Load variable costs
            if (data.variable_costs && Array.isArray(data.variable_costs)) {
                const dynamicVariableCosts = data.variable_costs.map(cost => ({
                    id: Date.now() + Math.random(),
                    label: cost.name,
                    value: cost.amount.toString(),
                    key: `dynamic_variable_${Date.now()}_${Math.random()}`,
                    variable_expense_type: cost.variable_expense_type || "monthly" // Default to monthly if not present
                }));

                if (dynamicVariableCosts.length > 0) {
                    // Calculate total variable cost (excluding percentage fields)
                    const totalVariable = dynamicVariableCosts.reduce((sum, field) => {
                        // Skip percentage fields (royalty/brand and fund) from total calculation
                        const royaltyFields = ["royalty", "brand and fund", "brand/ad fund"];
                        const labelLower = field.label.toLowerCase();
                        const isPercentageField = royaltyFields.some(fieldName => labelLower.includes(fieldName));

                        if (isPercentageField) {
                            return sum;
                        }
                        return sum + parseFloat(field.value || 0);
                    }, 0);

                    setExpenseData(prev => ({
                        ...prev,
                        dynamicVariableFields: dynamicVariableCosts,
                        totalVariableCost: totalVariable.toFixed(2)
                    }));
                }
            }
        } else {

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
                amount: parseFloat(field.value),
                fixed_expense_type: field.fixed_expense_type || "monthly"
            }));

        // Dynamic variable costs - include all fields in API
        let dynamicVariableCosts = [];
        if (variableFixedRef.current) {
            // Use the ref to get all fields (including percentage fields)
            const allFields = variableFixedRef.current.getFieldsForAPI();
            dynamicVariableCosts = allFields
                .filter(field => parseFloat(field.value) > 0)
                .map(field => ({
                    name: field.label,
                    amount: parseFloat(field.value),
                    variable_expense_type: field.variable_expense_type || "monthly"
                }));
        } else {
            // Fallback: include all fields
            dynamicVariableCosts = expenseData.dynamicVariableFields
                .filter(field => parseFloat(field.value) > 0)
                .map(field => ({
                    name: field.label,
                    amount: parseFloat(field.value),
                    variable_expense_type: field.variable_expense_type || "monthly"
                }));
        }

        const newApiData = {
            fixed_costs: dynamicFixedCosts,
            variable_costs: dynamicVariableCosts,
        };

        // Only update if the data has actually changed
        const currentDataString = JSON.stringify(apiExpenseData);
        const newDataString = JSON.stringify(newApiData);

        if (currentDataString !== newDataString) {
            setApiExpenseData(newApiData);
        }
    }, [expenseData, apiExpenseData]);

    // Recalculate totals whenever dynamic fields change
    useEffect(() => {
        // Calculate total fixed cost
        const totalFixed = expenseData.dynamicFixedFields.reduce((sum, field) => {
            return sum + parseFloat(field.value || 0);
        }, 0);

        // Calculate total variable cost (excluding percentage fields)
        const totalVariable = expenseData.dynamicVariableFields.reduce((sum, field) => {
            // Skip percentage fields (royalty/brand and fund) from total calculation
            const royaltyFields = ["royalty", "brand and fund", "brand/ad fund"];
            const labelLower = field.label.toLowerCase();
            const isPercentageField = royaltyFields.some(fieldName => labelLower.includes(fieldName));

            if (isPercentageField) {
                return sum;
            }
            return sum + parseFloat(field.value || 0);
        }, 0);


        // Update totals if they've changed
        if (parseFloat(expenseData.totalFixedCost) !== totalFixed) {
            setExpenseData(prev => ({ ...prev, totalFixedCost: totalFixed.toFixed(2) }));
        }

        if (parseFloat(expenseData.totalVariableCost) !== totalVariable) {
            setExpenseData(prev => ({ ...prev, totalVariableCost: totalVariable.toFixed(2) }));
        }
    }, [expenseData.dynamicFixedFields, expenseData.dynamicVariableFields]);

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

    const proceedWithSave = async () => {
        try {
            // Prepare data for API
            const stepData = {
                fixed_costs: apiExpenseData.fixed_costs,
                variable_costs: apiExpenseData.variable_costs,
            };

            // Call API through Zustand store with success callback
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

                if (isUpdateMode) {
                    // Update mode: show success message and stay on current page
                    message.success("Expense information updated successfully!");
                } else {
                    // Onboarding mode: navigate to next step
                    await navigateToNextStep(true); // Skip completion check since we just saved successfully
                }
            });

            if (!result.success) {
                console.error("Failed to save expense data:", result.error);
                message.error("Failed to save expense data. Please try again.");
            }

        } catch (error) {
            console.error("Error saving expense data:", error);
            message.error("An unexpected error occurred. Please try again.");
        }
    };

    const handleSave = async () => {
        try {
            // Check if we have any expenses to save
            const hasFixedCosts = apiExpenseData.fixed_costs && apiExpenseData.fixed_costs.length > 0;
            const hasVariableCosts = apiExpenseData.variable_costs && apiExpenseData.variable_costs.length > 0;

            if (!hasFixedCosts && !hasVariableCosts) {
                // Show confirmation popup asking if user wants to skip expenses
                Modal.confirm({
                    title: 'Are you sure?',
                    content: (
                        <div>
                            <p>By skipping expenses, your cash flow model may not reflect the true picture of your restaurant's performance.</p>
                        </div>
                    ),
                    okText: 'Yes, Skip for now',
                    cancelText: 'No, Lets enter expenses',
                    okType: 'default',
                    cancelType: 'primary',
                    onOk: () => {
                        // User chose to skip - proceed with empty expenses
                        proceedWithSave();
                    },
                    onCancel: () => {
                        // User chose to enter expenses - do nothing, let them continue editing
                    }
                });
                return;
            }

            // If we have expenses, proceed normally
            await proceedWithSave();

        } catch (error) {
            console.error("Error in handleSave:", error);
            message.error("An unexpected error occurred. Please try again.");
        }
    };

    return (
        <div className="w-full mx-auto">
            {/* Header Section with same styling as dashboard */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6 flex justify-between items-center">
                <OnboardingBreadcrumb
                    currentStep="Expenses"
                    description="When running a restaurant, it’s important to understand your cost structure—especially when calculating your break-even point and managing cash flow."
                    heading="Fixed Costs =" description2=" Non-negotiable. Always plan for them."
                    heading2="Variable Fixed Costs = " description3=" Can sometimes be paused or reduced if needed."
                />

            </div>

            {/* Content Section */}
            <div className="space-y-6">
                <FixedCost
                    data={expenseData}
                    updateData={updateExpenseData}
                    errors={validationErrors}
                />
                <VariableFixed
                    ref={variableFixedRef}
                    data={expenseData}
                    updateData={updateExpenseData}
                    errors={validationErrors}
                    isFranchise={isFranchise}
                />
                <TotalExpense
                    data={expenseData}
                    onSave={handleSave}
                    loading={loading}
                />
            </div>

            {isUpdateMode && (
                <div className="flex justify-end mt-8 pt-6">
                    <button
                        onClick={handleSave}
                        className="bg-orange-500 text-white px-8 py-3 rounded-lg hover:bg-orange-600 transition-colors font-semibold"
                        disabled={loading}
                    >
                        {loading ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            )}
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