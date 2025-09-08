import React, { useEffect, useState, useCallback, useImperativeHandle, forwardRef } from "react";
import { Button, Modal, Input, Select } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import useTooltips from "../../../../../utils/useTooltips";
import TooltipIcon from "../../../../common/TooltipIcon";
import MonthlyWeeklyToggle from "../../../../buttons/MonthlyWeeklyToggle";

const VariableFixed = forwardRef(({ data, updateData, errors = {} }, ref) => {
    const tooltips = useTooltips('onboarding-expense');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [newFieldLabel, setNewFieldLabel] = useState("");
    const [dynamicFields, setDynamicFields] = useState(data.dynamicVariableFields || []);

    // Update local state when data prop changes (when API data is loaded)
    useEffect(() => {
        if (data.dynamicVariableFields && data.dynamicVariableFields.length > 0) {
            setDynamicFields(data.dynamicVariableFields);
        }
    }, [data.dynamicVariableFields]);

    // Memoize the updateData callback to prevent unnecessary re-renders
    const memoizedUpdateData = useCallback((field, value) => {
        updateData(field, value);
    }, [updateData]);

    // Helper function to check if field should show percentage dropdown
    const shouldShowPercentageDropdown = (label) => {
        const royaltyFields = ["royalty", "brand", "fund"];
        const labelLower = label.toLowerCase();
        return royaltyFields.some(field => labelLower.includes(field));
    };

    // Generate percentage options for dropdown
    const percentageOptions = Array.from({ length: 10 }, (_, i) => ({
        value: (i + 1).toString(),
        label: `${i + 1}%`
    }));

    // Expose functions to parent component
    useImperativeHandle(ref, () => ({
        getFieldsForAPI: () => {
            // Return all fields for API calls - percentage fields should be included in API
            return dynamicFields;
        }
    }));

    const showModal = () => {
        setIsModalVisible(true);
    };

    const handleOk = () => {
        if (newFieldLabel.trim()) {
            if (newFieldLabel.trim().length < 2) {
                // Show error for short field names
                return;
            }
            const newField = {
                id: Date.now() + Math.random(),
                label: newFieldLabel.trim(),
                value: "",
                key: `dynamic_variable_${Date.now()}_${Math.random()}`,
                variable_expense_type: "monthly" // Default to monthly
            };
            const updatedFields = [...dynamicFields, newField];
            setDynamicFields(updatedFields);
            memoizedUpdateData('dynamicVariableFields', updatedFields);
            setNewFieldLabel("");
            setIsModalVisible(false);
        }
    };

    const handleCancel = () => {
        setNewFieldLabel("");
        setIsModalVisible(false);
    };

    const handleDynamicFieldChange = (id, value) => {
        const updatedFields = dynamicFields.map(field => 
            field.id === id ? { ...field, value } : field
        );
        setDynamicFields(updatedFields);
        
        // Update parent with new fields
        memoizedUpdateData('dynamicVariableFields', updatedFields);
        
        // Calculate and update total - exclude percentage fields
        const dynamicTotal = updatedFields.reduce((sum, field) => {
            // Skip percentage fields (royalty/brand and fund) from total calculation
            if (shouldShowPercentageDropdown(field.label)) {
                return sum;
            }
            return sum + parseFloat(field.value || 0);
        }, 0);
        
        // Only update if the total has actually changed
        const currentTotal = parseFloat(data.totalVariableCost || 0);
        if (Math.abs(dynamicTotal - currentTotal) > 0.01) {
            memoizedUpdateData('totalVariableCost', dynamicTotal.toFixed(2));
        }
    };

    const handleFrequencyChange = (id, variable_expense_type) => {
        const updatedFields = dynamicFields.map(field => 
            field.id === id ? { ...field, variable_expense_type } : field
        );
        setDynamicFields(updatedFields);
        memoizedUpdateData('dynamicVariableFields', updatedFields);
    };

    const handleDeleteField = (id) => {
        const updatedFields = dynamicFields.filter(field => field.id !== id);
        setDynamicFields(updatedFields);
        
        // Update parent with new fields
        memoizedUpdateData('dynamicVariableFields', updatedFields);
        
        // Calculate and update total - exclude percentage fields
        const dynamicTotal = updatedFields.reduce((sum, field) => {
            // Skip percentage fields (royalty/brand and fund) from total calculation
            if (shouldShowPercentageDropdown(field.label)) {
                return sum;
            }
            return sum + parseFloat(field.value || 0);
        }, 0);
        
        // Only update if the total has actually changed
        const currentTotal = parseFloat(data.totalVariableCost || 0);
        if (Math.abs(dynamicTotal - currentTotal) > 0.01) {
            memoizedUpdateData('totalVariableCost', dynamicTotal.toFixed(2));
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            {/* Header Section */}
            <div className="mb-6">
                <h3 className="text-xl font-bold text-orange-600">Variable Cost</h3>
                <p className="text-gray-600 text-sm">
                Can sometimes be paused or reduced if needed.
                    <TooltipIcon text={tooltips.variable_costs_description} />
                </p>
            </div>
            
            {/* Form Fields */}
            <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Variable Costs <span className="text-red-500">*</span>
                    <TooltipIcon text={tooltips.variable_costs} />
                </label>
                
                <div className="space-y-3">
                    {dynamicFields.map((field) => (
                        <div key={field.id} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1 w-full sm:w-auto">
                                <Input
                                    type="text"
                                    placeholder="Cost name"
                                    value={field.label}
                                    className="w-full sm:w-48 h-10 rounded-lg text-sm"
                                    disabled
                                />
                            </div>
                            <div className="flex-1 w-full sm:w-auto">
                                {shouldShowPercentageDropdown(field.label) ? (
                                    <Select
                                        placeholder="Select %"
                                        value={field.value}
                                        onChange={(value) => handleDynamicFieldChange(field.id, value)}
                                        className="w-full h-11 rounded-lg text-sm"
                                        options={percentageOptions}
                                    />
                                ) : (
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        value={field.value}
                                        onChange={(e) => handleDynamicFieldChange(field.id, e.target.value)}
                                        className="w-full sm:w-full h-10 rounded-lg text-sm"
                                        step="0.01"
                                        min="0"
                                    />
                                )}
                            </div>
                            
                                <div className="flex items-center gap-2">
                                    <MonthlyWeeklyToggle
                                        isMonthly={field.variable_expense_type === "monthly"}
                                        setIsMonthly={(isMonthly) => handleFrequencyChange(field.id, isMonthly ? "monthly" : "weekly")}
                                        size="medium"
                                    />
                                </div>
                            <Button
                                type="text"
                                danger
                                onClick={() => handleDeleteField(field.id)}
                                className="h-11 px-4 text-sm"
                            >
                                Delete
                            </Button>
                        </div>
                    ))}
                    
                    <Button
                        type="dashed"
                        icon={<PlusOutlined />}
                        onClick={showModal}
                        className="h-11 text-sm"
                    >
                        Add Variable Cost <TooltipIcon text={tooltips.add_variable_cost} />
                    </Button>
                </div>
                
                {errors.variableCosts && (
                    <span className="text-red-500 text-xs mt-1">{errors.variableCosts}</span>
                )}
            </div>

            <Modal
                title="Add Variable Cost"
                open={isModalVisible}
                onOk={handleOk}
                onCancel={handleCancel}
                okText="Add"
                cancelText="Cancel"
            >
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Cost Name</label>
                    <Input
                        placeholder="Enter cost name"
                        value={newFieldLabel}
                        onChange={(e) => setNewFieldLabel(e.target.value)}
                        className="h-11 text-sm"
                    />
                </div>
            </Modal>
        </div>
    );
});

export default VariableFixed;