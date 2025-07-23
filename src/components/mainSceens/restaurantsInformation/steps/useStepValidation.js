import { useState, useCallback } from 'react';

const useStepValidation = () => {
    const [validationErrors, setValidationErrors] = useState({});

    const clearFieldError = useCallback((fieldName) => {
        if (validationErrors[fieldName]) {
            setValidationErrors(prev => ({
                ...prev,
                [fieldName]: null
            }));
        }
    }, [validationErrors]);

    // Basic Information Validation
    const validateBasicInformation = useCallback((data) => {
        const errors = {};

        if (!data.restaurant_name?.trim()) {
            errors.restaurant_name = "Restaurant name is required";
        }
        if (!data.number_of_locations || data.number_of_locations < 1) {
            errors.number_of_locations = "Number of locations must be at least 1";
        }
        if (!data.restaurant_type?.trim()) {
            errors.restaurant_type = "Restaurant type is required";
        }
        if (!data.menu_type?.trim()) {
            errors.menu_type = "Menu type is required";
        }

        // Validate locations
        if (data.locations && data.locations.length > 0) {
            data.locations.forEach((location, index) => {
                if (!location.location_name?.trim()) {
                    errors[`location_${index}_name`] = "Location name is required";
                }
                if (!location.address_1?.trim()) {
                    errors[`location_${index}_address`] = "Address is required";
                }
                if (!location.country?.trim()) {
                    errors[`location_${index}_country`] = "Country is required";
                }
                if (!location.state?.trim()) {
                    errors[`location_${index}_state`] = "State is required";
                }
                if (!location.zip_code?.trim()) {
                    errors[`location_${index}_zip`] = "Zip code is required";
                } else if (!/^\d{5}(-\d{4})?$/.test(location.zip_code)) {
                    errors[`location_${index}_zip`] = "Please enter a valid zip code";
                }
                if (!location.sqft || isNaN(location.sqft) || parseInt(location.sqft) <= 0) {
                    errors[`location_${index}_sqft`] = "Please enter a valid square footage";
                }
            });
        }

        return errors;
    }, []);

    // Labour Information Validation
    const validateLabourInformation = useCallback((data) => {
        console.log("=== Labour Information Validation ===");
        console.log("Validating data:", data);
        
        const errors = {};

        if (!data.goal?.trim()) {
            errors.goal = "Labor goal is required";
            console.log("❌ Goal validation failed: missing or empty");
        } else if (isNaN(data.goal) || parseFloat(data.goal) < 0 || parseFloat(data.goal) > 100) {
            errors.goal = "Labor goal must be between 0 and 100";
            console.log("❌ Goal validation failed: invalid range");
        } else {
            console.log("✅ Goal validation passed:", data.goal);
        }

        if (!data.needs_attention?.trim()) {
            errors.needs_attention = "Needs attention threshold is required";
            console.log("❌ Needs attention validation failed: missing or empty");
        } else if (isNaN(data.needs_attention) || parseFloat(data.needs_attention) < 0 || parseFloat(data.needs_attention) > 100) {
            errors.needs_attention = "Needs attention threshold must be between 0 and 100";
            console.log("❌ Needs attention validation failed: invalid range");
        } else {
            console.log("✅ Needs attention validation passed:", data.needs_attention);
        }

        if (!data.danger?.trim()) {
            errors.danger = "Danger threshold is required";
            console.log("❌ Danger validation failed: missing or empty");
        } else if (isNaN(data.danger) || parseFloat(data.danger) < 0 || parseFloat(data.danger) > 100) {
            errors.danger = "Danger threshold must be between 0 and 100";
            console.log("❌ Danger validation failed: invalid range");
        } else {
            console.log("✅ Danger validation passed:", data.danger);
        }

        if (!data.avg_hourly_rate || isNaN(data.avg_hourly_rate) || parseFloat(data.avg_hourly_rate) <= 0) {
            errors.avg_hourly_rate = "Please enter a valid hourly rate";
            console.log("❌ Hourly rate validation failed:", data.avg_hourly_rate);
        } else {
            console.log("✅ Hourly rate validation passed:", data.avg_hourly_rate);
        }

        if (!data.labor_record_method) {
            errors.labor_record_method = "Labor record method is required";
            console.log("❌ Labor record method validation failed: missing");
        } else {
            console.log("✅ Labor record method validation passed:", data.labor_record_method);
        }

        console.log("Final validation errors:", errors);
        console.log("Validation result:", Object.keys(errors).length === 0 ? "PASSED" : "FAILED");
        
        return errors;
    }, []);

    // Food Cost Details Validation
    const validateFoodCostDetails = useCallback((data) => {
        console.log("=== Food Cost Details Validation ===");
        console.log("Validating data:", data);
        
        const errors = {};

        // Handle both string and numeric cogs_goal, remove % symbol if present
        const cogsGoal = data.cogs_goal?.toString() || data.cogs_goal;
        const cogsGoalClean = cogsGoal ? cogsGoal.toString().replace('%', '') : '';
        
        console.log("Original cogs_goal:", cogsGoal);
        console.log("Cleaned cogs_goal:", cogsGoalClean);
        
        if (!cogsGoalClean || cogsGoalClean.trim() === '') {
            errors.cogs_goal = "COGS goal is required";
            console.log("❌ COGS goal validation failed: missing or empty");
        } else if (isNaN(cogsGoalClean) || parseFloat(cogsGoalClean) < 0 || parseFloat(cogsGoalClean) > 100) {
            errors.cogs_goal = "COGS goal must be between 0 and 100";
            console.log("❌ COGS goal validation failed: invalid range - value:", parseFloat(cogsGoalClean));
        } else {
            console.log("✅ COGS goal validation passed:", cogsGoalClean, "parsed as:", parseFloat(cogsGoalClean));
        }

        if (data.use_third_party_delivery && (!data.delivery_days || data.delivery_days.length === 0)) {
            errors.delivery_days = "Please select at least one delivery day";
            console.log("❌ Delivery days validation failed: third party delivery enabled but no days selected");
        } else {
            console.log("✅ Delivery days validation passed");
        }

        console.log("Final validation errors:", errors);
        console.log("Validation result:", Object.keys(errors).length === 0 ? "PASSED" : "FAILED");
        
        return errors;
    }, []);

    // Sales Channels Validation
    const validateSalesChannels = useCallback((data) => {
        const errors = {};

        // At least one sales channel must be selected
        if (!data.in_store && !data.online && !data.from_app && !data.third_party) {
            errors.sales_channels = "Please select at least one sales channel";
        }

        return errors;
    }, []);

    // Expense Validation
    const validateExpense = useCallback((data) => {
        const errors = {};

        // Validate fixed costs
        if (data.fixed_costs && data.fixed_costs.length > 0) {
            data.fixed_costs.forEach((cost, index) => {
                if (!cost.name?.trim()) {
                    errors[`fixed_cost_${index}_name`] = "Cost name is required";
                }
                if (!cost.amount || isNaN(cost.amount) || parseFloat(cost.amount) < 0) {
                    errors[`fixed_cost_${index}_amount`] = "Please enter a valid amount";
                }
            });
        }

        // Validate variable costs
        if (data.variable_costs && data.variable_costs.length > 0) {
            data.variable_costs.forEach((cost, index) => {
                if (!cost.name?.trim()) {
                    errors[`variable_cost_${index}_name`] = "Cost name is required";
                }
                if (!cost.amount || isNaN(cost.amount) || parseFloat(cost.amount) < 0) {
                    errors[`variable_cost_${index}_amount`] = "Please enter a valid amount";
                }
            });
        }

        return errors;
    }, []);

    // Validate specific step
    const validateStep = useCallback((stepName, data) => {
        let errors = {};

        switch (stepName) {
            case 'Basic Information':
                errors = validateBasicInformation(data);
                break;
            case 'Labour Information':
                errors = validateLabourInformation(data);
                break;
            case 'Food Cost Details':
                errors = validateFoodCostDetails(data);
                break;
            case 'Sales Channels':
                errors = validateSalesChannels(data);
                break;
            case 'Expense':
                errors = validateExpense(data);
                break;
            default:
                console.warn(`Unknown step: ${stepName}`);
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    }, [validateBasicInformation, validateLabourInformation, validateFoodCostDetails, validateSalesChannels, validateExpense]);

    // Validate all steps
    const validateAllSteps = useCallback((allData) => {
        const allErrors = {};

        Object.keys(allData).forEach(stepName => {
            if (stepName !== 'restaurant_id') {
                const stepErrors = validateStep(stepName, allData[stepName].data);
                if (!stepErrors) {
                    allErrors[stepName] = validationErrors;
                }
            }
        });

        setValidationErrors(allErrors);
        return Object.keys(allErrors).length === 0;
    }, [validateStep, validationErrors]);

    const clearAllErrors = useCallback(() => {
        setValidationErrors({});
    }, []);

    return {
        validationErrors,
        clearFieldError,
        validateBasicInformation,
        validateLabourInformation,
        validateFoodCostDetails,
        validateSalesChannels,
        validateExpense,
        validateStep,
        validateAllSteps,
        clearAllErrors
    };
};

export default useStepValidation; 