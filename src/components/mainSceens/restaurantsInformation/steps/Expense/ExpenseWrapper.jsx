
import React, { useState, useCallback, useEffect, useRef } from "react";
import { message, Modal, Select } from "antd";
import { useLocation } from "react-router-dom";
import OperatingExpenses from "./OperatingExpenses";
import TotalExpense from "./TotalExpense";
import { TabProvider } from "../../TabContext";
import { useTabHook } from "../../useTabHook";
import useStore from "../../../../../store/store";
import useStepValidation from "../useStepValidation";
import LoadingSpinner from "../../../../layout/LoadingSpinner";
import OnboardingBreadcrumb from "../../../../common/OnboardingBreadcrumb";
import PrimaryButton from "../../../../buttons/Buttons";

const ExpenseWrapperContent = () => {
    const location = useLocation();
    const { submitStepData, onboardingLoading: loading, onboardingError: error, clearError, completeOnboardingData, checkOnboardingCompletion, loadExistingOnboardingData, isOnBoardingCompleted } = useStore();
    const { validationErrors, clearFieldError, validateExpense, setValidationErrors, clearAllErrors } = useStepValidation();
    const { navigateToNextStep, completeOnboarding, activeTab, tabs } = useTabHook();

    // Check if this is update mode (accessed from sidebar) or onboarding mode
    const isUpdateMode = !location.pathname.includes('/onboarding');
    
    // Scroll to top when component mounts
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    // Load existing expense data on mount if in update mode
    // Use ref to prevent multiple calls
    const hasLoadedRef = useRef(false);
    useEffect(() => {
        const loadExpenseData = async () => {
            if (isUpdateMode && !hasLoadedRef.current) {
                // Check if we already have expense data loaded
                const expenseInfoData = completeOnboardingData["Expense"];
                if (expenseInfoData && expenseInfoData.data && (expenseInfoData.data.expenses?.length > 0 || expenseInfoData.data.fixed_costs?.length > 0 || expenseInfoData.data.variable_costs?.length > 0)) {
                    // Data already loaded, skip API call
                    hasLoadedRef.current = true;
                    return;
                }
                
                hasLoadedRef.current = true;
                try {
                    // Load onboarding data which includes Expense information (force refresh to get latest data)
                    await loadExistingOnboardingData(true);
                } catch (error) {
                    console.error('Error loading expense data:', error);
                    hasLoadedRef.current = false; // Allow retry on error
                }
            }
        };
        
        loadExpenseData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isUpdateMode]);

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
        expenses: [],
    });

    // Load saved data when component mounts or when completeOnboardingData changes
    useEffect(() => {
        const expenseInfoData = completeOnboardingData["Expense"];

        if (expenseInfoData && expenseInfoData.data) {
            const data = expenseInfoData.data;

            // Load all expenses (support both new format 'expenses' and old format 'fixed_costs'/'variable_costs')
            const allCosts = data.expenses || [
                ...(data.fixed_costs || []),
                ...(data.variable_costs || [])
            ];

            if (allCosts.length > 0) {
                const dynamicExpenses = allCosts.map((cost, index) => ({
                    id: cost.id || Date.now() + index, // Preserve API ID if available
                    label: cost.name,
                    value: cost.amount ? cost.amount.toString() : "0",
                    key: `dynamic_expense_${cost.id || Date.now()}_${index}`,
                    expense_type: cost.expense_type || cost.fixed_expense_type || cost.variable_expense_type || "monthly",
                    is_active: cost.is_active !== undefined ? cost.is_active : true,
                    is_value_type: cost.is_value_type !== undefined ? cost.is_value_type : true,
                    category: cost.category || "Other"
                }));

                // Calculate total expense - convert all to monthly for consistent calculation
                const WEEKS_PER_MONTH = 4.33;
                const totalExpense = dynamicExpenses.reduce((sum, field) => {
                    // Skip percentage fields (royalty/brand and fund) from total calculation
                    const royaltyFields = ["royalty", "brand and fund", "brand/ad fund"];
                    const labelLower = field.label.toLowerCase();
                    const isPercentageField = royaltyFields.some(fieldName => labelLower.includes(fieldName));

                    if (isPercentageField) {
                        return sum;
                    }
                    
                    const fieldValue = parseFloat(field.value || 0);
                    if (field.expense_type === 'weekly') {
                        // Convert weekly to monthly: weekly * 4.33
                        return sum + (fieldValue * WEEKS_PER_MONTH);
                    } else {
                        // Already monthly
                        return sum + fieldValue;
                    }
                }, 0);

                setExpenseData(prev => ({
                    ...prev,
                    dynamicFixedFields: dynamicExpenses,
                    dynamicVariableFields: [], // No longer using variable fields
                    totalFixedCost: totalExpense.toFixed(2),
                    totalVariableCost: "0.00"
                }));
            }
        }
        // Note: If no data exists, OperatingExpenses component will initialize with defaults
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
        // Combine all expenses into a single list
        // Include ALL expenses (active and inactive) with their status
        const allExpenses = [
            ...expenseData.dynamicFixedFields,
            ...expenseData.dynamicVariableFields
        ]
            .filter(field => field && field.label && field.label.trim() !== '') // Only filter out invalid entries
            .map(field => ({
                name: field.label,
                amount: parseFloat(field.value || 0),
                expense_type: field.expense_type || field.fixed_expense_type || field.variable_expense_type || "monthly",
                is_value_type: field.is_value_type !== undefined ? field.is_value_type : true,
                is_active: field.is_active !== undefined ? field.is_active : true
            }));

        // Use new unified expenses format
        const newApiData = {
            expenses: allExpenses,
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
        // Conversion factor: 4.33 weeks per month (52 weeks ÷ 12 months)
        const WEEKS_PER_MONTH = 4.33;
        
        // Combine all expenses and calculate total
        const allExpenses = [
            ...expenseData.dynamicFixedFields,
            ...expenseData.dynamicVariableFields
        ];
        
        // Calculate total expense - convert all to monthly for consistent calculation
        // Only include active expenses
        const totalExpense = allExpenses.reduce((sum, field) => {
            // Skip inactive expenses
            const isActive = field.is_active !== undefined ? field.is_active : true;
            if (!isActive) {
                return sum;
            }

            // Skip percentage fields (royalty/brand and fund) from total calculation
            const royaltyFields = ["royalty", "brand and fund", "brand/ad fund"];
            const labelLower = field.label.toLowerCase();
            const isPercentageField = royaltyFields.some(fieldName => labelLower.includes(fieldName));

            if (isPercentageField) {
                return sum;
            }
            
            const fieldValue = parseFloat(field.value || 0);
            const expenseType = field.expense_type || field.fixed_expense_type || field.variable_expense_type || "monthly";
            
            if (expenseType === 'weekly') {
                // Convert weekly to monthly: weekly * 4.33
                return sum + (fieldValue * WEEKS_PER_MONTH);
            } else {
                // Already monthly
                return sum + fieldValue;
            }
        }, 0);

        // Update total (using totalFixedCost as the unified total)
        if (parseFloat(expenseData.totalFixedCost) !== totalExpense) {
            setExpenseData(prev => ({ 
                ...prev, 
                totalFixedCost: totalExpense.toFixed(2),
                totalVariableCost: "0.00" // No longer using variable costs
            }));
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

        // Check if at least one expense is added
        const hasExpenses = data.expenses && data.expenses.length > 0;

        if (!hasExpenses) {
            errors.no_fields = "Please add at least one expense field before saving";
            return errors;
        }

        // Validate each expense has a name
        // Amount can be 0 for inactive expenses
        if (data.expenses && data.expenses.length > 0) {
            data.expenses.forEach((expense, index) => {
                if (!expense.name?.trim()) {
                    errors[`expense_${index}_name`] = "Expense name is required";
                }
                // Only validate amount > 0 for active expenses
                if (expense.is_active && (!expense.amount || isNaN(expense.amount) || parseFloat(expense.amount) <= 0)) {
                    errors[`expense_${index}_amount`] = "Please enter a valid amount greater than 0 for active expenses";
                }
            });
        }

        return errors;
    };

    const proceedWithSave = async () => {
        try {
            // Prepare data for API
            const stepData = {
                expenses: apiExpenseData.expenses,
            };

            // Call API through Zustand store with success callback
            const result = await submitStepData("Expense", stepData, async (responseData) => {
                // Success callback - handle navigation based on mode

                // Clear all validation errors on successful save
                clearAllErrors();

                const grandTotal = apiExpenseData.expenses.reduce((sum, cost) => sum + cost.amount, 0);

                // Check if restaurant_id was returned and log it
                if (responseData && responseData.restaurant_id) {
                }

                // Expenses is the last onboarding step, so always navigate to Sales Data after saving
                if (isUpdateMode && isOnBoardingCompleted) {
                    // Update mode AND onboarding is complete: show success message and navigate to Sales Data
                    message.success("Expense information updated successfully!");
                } else {
                    // Onboarding mode OR new user in update mode: navigate to next step (Sales Data)
                    message.success("Expense information saved successfully!");
                }
                // Always navigate to Sales Data since Expenses is the last onboarding step
                await navigateToNextStep(true); // Skip completion check since we just saved successfully
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
            const hasExpenses = apiExpenseData.expenses && apiExpenseData.expenses.length > 0;

            if (!hasExpenses) {
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

    // Show loading spinner overlay when loading
    if (loading) {
        return (
            <div className="relative">
                <div className="absolute inset-0 bg-white bg-opacity-90 z-50 flex items-center justify-center">
                    <LoadingSpinner 
                        message="Saving expense information..." 
                        size="medium" 
                        subtext="Please wait while we save your changes..."
                        showSubtext={true}
                    />
                </div>
                <div className="opacity-50 pointer-events-none">
                    <div className="w-full mx-auto">
                        {/* Header Section with same styling as dashboard */}
                        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6 flex justify-between items-center">
                            <OnboardingBreadcrumb
                                currentStep="Expenses"
                                description="When running a restaurant, it's important to understand your cost structure—especially when calculating your break-even point and managing cash flow."
                                heading="Fixed Costs =" description2=" Non-negotiable. Always plan for them."
                                heading2="Variable Fixed Costs = " description3=" Can sometimes be paused or reduced if needed."
                            />
                        </div>

                        {/* Content Section */}
                        <div className="space-y-6">
                            <OperatingExpenses
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
                            <div className="flex justify-end gap-3 mt-8 pt-6">
                                <button
                                    onClick={() => {
                                        navigateToNextStep(true);
                                    }}
                                    disabled={loading}
                                    className={`bg-gray-200 text-gray-700 px-8 py-3 rounded-lg transition-colors flex items-center gap-2 font-semibold ${
                                        loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-300'
                                    }`}
                                >
                                    Skip
                                </button>
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
                </div>
            </div>
        );
    }

    return (
        <div className="w-full mx-auto">
            {/* Header Section with same styling as dashboard */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6 flex justify-between items-center">
                <OnboardingBreadcrumb
                    currentStep="Expenses"
                    description="When running a restaurant, it's important to understand your cost structure—especially when calculating your break-even point and managing cash flow."
                    heading="Expenses =" description2=" Non-negotiable. Always plan for them."
                />

            </div>

            {/* Content Section */}
            <div className="space-y-6">
                <OperatingExpenses
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

            <div className="flex justify-end gap-3 mt-8 pt-6">
                <button
                    onClick={() => {
                     
                        navigateToNextStep(true);
                    }}
                    disabled={loading}
                    className={`bg-gray-200 text-gray-700 px-8 py-3 rounded-lg transition-colors flex items-center gap-2 font-semibold ${
                        loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-300'
                    }`}
                >
                    Skip
                </button>
                {isUpdateMode && (
                    <button
                        onClick={handleSave}
                        className="bg-orange-500 text-white px-8 py-3 rounded-lg hover:bg-orange-600 transition-colors font-semibold"
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