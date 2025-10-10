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
                } else if (!/^[A-Za-z0-9\s-]{2,20}$/.test(location.zip_code)) {
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
        
        
        const errors = {};

        // Handle both string and numeric labour_goal, remove % symbol if present
        const laborGoal = data.labour_goal?.toString() || data.labour_goal;
        const laborGoalClean = laborGoal ? laborGoal.toString().replace('%', '') : '';
        
        
        
        if (!laborGoalClean || laborGoalClean.trim() === '') {
            errors.labour_goal = "Labor goal is required";
            
        } else if (isNaN(laborGoalClean) || parseFloat(laborGoalClean) < 0 || parseFloat(laborGoalClean) > 100) {
            errors.labour_goal = "Labor goal must be between 0 and 100";
            
        } else {
            
        }

        if (!data.avg_hourly_rate || isNaN(data.avg_hourly_rate) || parseFloat(data.avg_hourly_rate) <= 0) {
            errors.avg_hourly_rate = "Please enter a valid hourly rate";
            
        } else {
            
        }

        if (!data.labor_record_method) {
            errors.labor_record_method = "Labor record method is required";
            
        } else {
            
        }

        
        
        return errors;
    }, []);

    // Food Cost Details Validation
    const validateFoodCostDetails = useCallback((data) => {
        
        
        const errors = {};

        // 1. COGS Goal Validation
        const cogsGoal = data.cogs_goal?.toString() || data.cogs_goal;
        const cogsGoalClean = cogsGoal ? cogsGoal.toString().replace('%', '') : '';
        
        
        
        if (!cogsGoalClean || cogsGoalClean.trim() === '') {
            errors.cogs_goal = "COGS goal is required";
            
        } else if (isNaN(cogsGoalClean) || parseFloat(cogsGoalClean) < 15 || parseFloat(cogsGoalClean) > 50) {
            errors.cogs_goal = "COGS goal must be between 15% and 50%";
            
        } else {
            const goalValue = parseFloat(cogsGoalClean);
            let zoneMessage = "";
            
            if (goalValue <= 31) {
                zoneMessage = " (Green Zone - Goal)";
            } else if (goalValue <= 33) {
                zoneMessage = " (Yellow Zone - Needs Attention)";
            } else {
                zoneMessage = " (Red Zone - Danger)";
            }
            
            
        }

        // 2. Delivery Days Validation
        // Validate that at least one delivery day is selected
        if (!data.delivery_days || data.delivery_days.length === 0) {
            errors.delivery_days = "Please select at least one delivery day";
            
        } else {
            
        }

        // 3. Validate delivery days format and content
        if (data.delivery_days && Array.isArray(data.delivery_days)) {
            const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            const invalidDays = data.delivery_days.filter(day => !validDays.includes(day.toLowerCase()));
            
            if (invalidDays.length > 0) {
                errors.delivery_days = "Invalid delivery days selected. Only weekdays (Monday-Friday) are allowed.";
                
            } else {
                
            }
        }

        // 4. Validate selectedDays object format (for DeliveryFrequency component)
        if (data.selectedDays && typeof data.selectedDays === 'object') {
            const selectedDaysArray = Object.keys(data.selectedDays).filter(day => data.selectedDays[day]);
            if (selectedDaysArray.length === 0) {
                errors.delivery_days = "Please select at least one delivery day";
                
            } else {
                
            }
        }

        
        return errors;
    }, []);

    // Sales Channels Validation
    const validateSalesChannels = useCallback((data) => {
        
        
        const errors = {};

        // At least one sales channel must be selected
        if (!data.in_store && !data.online && !data.from_app && !data.third_party) {
            errors.sales_channels = "Please select at least one sales channel";
            
        } else {
            
        }

        // Validate restaurant days - check for at least one OPEN day
        if (!data.selectedDays || Object.keys(data.selectedDays).length === 0) {
            errors.restaurant_days = "Please select at least one restaurant day";
            
        } else {
            const openDays = Object.keys(data.selectedDays).filter(day => data.selectedDays[day]);
            if (openDays.length === 0) {
                errors.restaurant_days = "Please select at least one restaurant day";
                
            } else {
                
            }
        }
        

        // Validate third party providers if third-party sales is enabled
        if (data.third_party) {
            
            
            if (data.providers && data.providers.length > 0) {
                let hasValidProvider = false;
                let hasPartialProvider = false;
                
                data.providers.forEach((provider, index) => {
                    
                    
                    // Check if this provider has any data entered (partial or complete)
                    const hasName = provider.providerName?.trim();
                    const hasFee = provider.providerFee && provider.providerFee !== '';
                    
                    // If provider has any data, validate both fields
                    if (hasName || hasFee) {
                        hasPartialProvider = true;
                        
                        if (!hasName) {
                            errors[`provider_${index}_name`] = "Provider name is required";

                        } else {
                            
                        }
                        
                        if (!hasFee) {
                            errors[`provider_${index}_fee`] = "Provider fee is required";
                            
                        } else if (isNaN(provider.providerFee) || parseInt(provider.providerFee) < 1 || parseInt(provider.providerFee) > 50) {
                            errors[`provider_${index}_fee`] = "Provider fee must be between 1% and 50%";
                            
                        } else {
                            
                        }
                        
                        // Check if this provider has complete data
                        if (hasName && hasFee && !isNaN(provider.providerFee) && parseInt(provider.providerFee) >= 1 && parseInt(provider.providerFee) <= 50) {
                            hasValidProvider = true;
                            
                        } else {
                            
                        }
                    } else {
                        
                    }
                });
                
                // If there are partial providers but no complete ones, show a general error
                if (hasPartialProvider && !hasValidProvider) {
                    errors.providers = "Please add at least one third-party provider with complete information";
                    
                } else if (!hasPartialProvider) {
                    // If no providers have any data at all, show a different error
                    errors.providers = "Please add at least one third-party provider";
                    
                } else {
                    
                }
            } else {
                errors.providers = "Please add at least one third-party provider";
                
            }
        } else {
            
        }

        
        
        return errors;
    }, []);

    // Expense Validation
    const validateExpense = useCallback((data) => {

        
        const errors = {};

        // 1. Check if at least one expense category has data
        const hasFixedCosts = data.fixed_costs && data.fixed_costs.length > 0;
        const hasVariableCosts = data.variable_costs && data.variable_costs.length > 0;
        
        if (!hasFixedCosts && !hasVariableCosts) {
            errors.no_expenses = "Please add at least one expense (fixed or variable cost)";
            
        } else {
            // Check for specific missing categories
            if (!hasFixedCosts) {
                errors.no_fixed_costs = "Please add at least one fixed cost";
                
            }
            if (!hasVariableCosts) {
                errors.no_variable_costs = "Please add at least one variable cost";

            }
            
        }

        // 2. Validate fixed costs
        if (data.fixed_costs && data.fixed_costs.length > 0) {
            data.fixed_costs.forEach((cost, index) => {
                // Validate cost name
                if (!cost.name?.trim()) {
                    errors[`fixed_cost_${index}_name`] = "Fixed cost name is required";
                    
                } else if (cost.name.trim().length < 2) {
                    errors[`fixed_cost_${index}_name`] = "Fixed cost name must be at least 2 characters";
                    
                } else {
                    
                }

                // Validate cost amount
                if (!cost.amount || cost.amount === '') {
                    errors[`fixed_cost_${index}_amount`] = "Fixed cost amount is required";
                    
                } else if (isNaN(cost.amount) || parseFloat(cost.amount) <= 0) {
                    errors[`fixed_cost_${index}_amount`] = "Fixed cost amount must be greater than 0";
                    
                } else if (parseFloat(cost.amount) > 999999) {
                    errors[`fixed_cost_${index}_amount`] = "Fixed cost amount cannot exceed $999,999";
                    
                } else {
                    
                }
            });
        }

        // 3. Validate variable costs
        if (data.variable_costs && data.variable_costs.length > 0) {
            data.variable_costs.forEach((cost, index) => {
                // Validate cost name
                if (!cost.name?.trim()) {
                    errors[`variable_cost_${index}_name`] = "Variable cost name is required";
                    
                } else if (cost.name.trim().length < 2) {
                    errors[`variable_cost_${index}_name`] = "Variable cost name must be at least 2 characters";
                    
                } else {
                    
                }

                // Validate cost amount
                if (!cost.amount || cost.amount === '') {
                    errors[`variable_cost_${index}_amount`] = "Variable cost amount is required";

                } else if (isNaN(cost.amount) || parseFloat(cost.amount) <= 0) {
                    errors[`variable_cost_${index}_amount`] = "Variable cost amount must be greater than 0";
                    
                } else if (parseFloat(cost.amount) > 999999) {
                    errors[`variable_cost_${index}_amount`] = "Variable cost amount cannot exceed $999,999";
                    
                } else {
                    
                }
            });
        }

        // 4. Validate dynamic fields (for UI components)
        if (data.dynamicFixedFields && data.dynamicFixedFields.length > 0) {
            data.dynamicFixedFields.forEach((field, index) => {
                if (field.value && field.value !== '') {
                    // Only validate if field has a value
                    if (isNaN(field.value) || parseFloat(field.value) < 0) {
                        errors[`dynamic_fixed_${index}_amount`] = "Please enter a valid amount";
                        
                    } else if (parseFloat(field.value) > 999999) {
                        errors[`dynamic_fixed_${index}_amount`] = "Amount cannot exceed $999,999";
                        
                    }
                }
            });
        }

        if (data.dynamicVariableFields && data.dynamicVariableFields.length > 0) {
            data.dynamicVariableFields.forEach((field, index) => {
                if (field.value && field.value !== '') {
                    // Only validate if field has a value
                    if (isNaN(field.value) || parseFloat(field.value) < 0) {
                        errors[`dynamic_variable_${index}_amount`] = "Please enter a valid amount";
                        
                    } else if (parseFloat(field.value) > 999999) {
                        errors[`dynamic_variable_${index}_amount`] = "Amount cannot exceed $999,999";
                        
                    }
                }
            });
        }

        // 5. Validate total amounts
        const totalFixed = data.fixed_costs ? data.fixed_costs.reduce((sum, cost) => sum + parseFloat(cost.amount || 0), 0) : 0;
        const totalVariable = data.variable_costs ? data.variable_costs.reduce((sum, cost) => sum + parseFloat(cost.amount || 0), 0) : 0;
        const grandTotal = totalFixed + totalVariable;

        if (grandTotal > 999999) {
            errors.total_amount = "Total expenses cannot exceed $999,999";
            
        } else {
            
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
            case 'Labor Information':
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
        setValidationErrors,
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