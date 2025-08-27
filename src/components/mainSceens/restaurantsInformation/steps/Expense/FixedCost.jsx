import React, { useEffect, useState, useCallback } from "react";
import { Button, Modal, Input } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import useTooltips from "../../../../../utils/useTooltips";
import TooltipIcon from "../../../../common/TooltipIcon";
import { Tooltip } from "antd";
import SubTrack from '../../../../../assets/svgs/Subtract.svg';

const FixedCost = ({ data, updateData, errors = {} }) => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [newFieldLabel, setNewFieldLabel] = useState("");
    const [dynamicFields, setDynamicFields] = useState(data.dynamicFixedFields || []);

    // Update local state when data prop changes (when API data is loaded)
    useEffect(() => {
        if (data.dynamicFixedFields && data.dynamicFixedFields.length > 0) {
            setDynamicFields(data.dynamicFixedFields);
        }
    }, [data.dynamicFixedFields]);

    // Memoize the updateData callback to prevent unnecessary re-renders
    const memoizedUpdateData = useCallback((field, value) => {
        updateData(field, value);
    }, [updateData]);

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
                key: `dynamic_fixed_${Date.now()}_${Math.random()}`
            };
            const updatedFields = [...dynamicFields, newField];
            setDynamicFields(updatedFields);
            memoizedUpdateData('dynamicFixedFields', updatedFields);
            setNewFieldLabel("");
            setIsModalVisible(false);
        }
    };

    const handleCancel = () => {
        setNewFieldLabel("");
        setIsModalVisible(false);
    };

    const handleDynamicFieldChange = (id, value) => {
        if (value === '' || parseFloat(value) >= 0) {
            const updatedFields = dynamicFields.map(field => 
                field.id === id ? { ...field, value } : field
            );
            setDynamicFields(updatedFields);
            
            // Update parent with new fields
            memoizedUpdateData('dynamicFixedFields', updatedFields);
            
            // Calculate and update total
            const dynamicTotal = updatedFields.reduce((sum, field) => {
                return sum + parseFloat(field.value || 0);
            }, 0);
            
            // Only update if the total has actually changed
            const currentTotal = parseFloat(data.totalFixedCost || 0);
            if (Math.abs(dynamicTotal - currentTotal) > 0.01) {
                memoizedUpdateData('totalFixedCost', dynamicTotal.toFixed(2));
            }
        }
    };

    const handleDeleteField = (id) => {
        const updatedFields = dynamicFields.filter(field => field.id !== id);
        setDynamicFields(updatedFields);
        
        // Update parent with new fields
        memoizedUpdateData('dynamicFixedFields', updatedFields);
        
        // Calculate and update total
        const dynamicTotal = updatedFields.reduce((sum, field) => {
            return sum + parseFloat(field.value || 0);
        }, 0);
        
        // Only update if the total has actually changed
        const currentTotal = parseFloat(data.totalFixedCost || 0);
        if (Math.abs(dynamicTotal - currentTotal) > 0.01) {
            memoizedUpdateData('totalFixedCost', dynamicTotal.toFixed(2));
        }
    };

    const tooltips = useTooltips('onboarding-expense');

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            {/* Header Section */}
            <div className="mb-6">
                <h3 className="text-xl font-bold text-orange-600">Fixed Cost</h3>
                <p className="text-gray-600 text-sm">
                    What are the fixed costs for this location?
                </p>
            </div>
            
            {/* Form Fields */}
            <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Fixed Costs <span className="text-red-500">*</span>
                    <TooltipIcon text={tooltips['fixed_costs']} />
                </label>
                
                <div className="space-y-3">
                    {dynamicFields.map((field) => (
                        <div key={field.id} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1 w-full sm:w-auto">
                                <Input
                                    type="text"
                                    placeholder="Cost name"
                                    value={field.label}
                                    className="w-full sm:w-48 h-11 rounded-lg text-sm"
                                    disabled
                                />
                            </div>
                            <div className="flex-1 w-full sm:w-auto">
                                <Input
                                    type="number"
                                    placeholder="0.00"
                                    value={field.value}
                                    onChange={(e) => handleDynamicFieldChange(field.id, e.target.value)}
                                    className="w-full sm:w-32 h-11 rounded-lg text-sm"
                                    step="0.01"
                                    min="0"
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
                        Add Fixed Cost
                    </Button>
                </div>
                
                {errors.fixedCosts && (
                    <span className="text-red-500 text-xs mt-1">{errors.fixedCosts}</span>
                )}
            </div>

            <Modal
                title="Add Fixed Cost"
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
}

export default FixedCost;