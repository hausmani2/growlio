import React, { useEffect, useState, useCallback } from "react";
import { Button, Modal, Input } from "antd";
import { PlusOutlined } from "@ant-design/icons";

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

    return (
        <div>
            <div className="flex flex-col lg:flex-row mt-5 gap-4 lg:gap-0">
                <div className="w-full lg:w-[40%]">
                    <div className="flex flex-col gap-2">
                        <h4 className="text-lg !font-bold !mb-0">Fixed Cost</h4>
                        <span className="text-sm sm:text-base text-neutral-600 hidden sm:block">
                            What are the fixed costs for this location?
                        </span>
                    </div>
                </div>
                <div className="w-full lg:w-[60%]">
                    <div className="flex flex-col gap-3 p-4 sm:p-6 bg-white rounded-xl">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm sm:text-base !font-bold text-neutral-600">
                                Fixed Costs <span className="text-red-500">*</span>
                            </label>
                            <div className="flex flex-col gap-3">
                                {dynamicFields.map((field) => (
                                    <div key={field.id} className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-start sm:items-center">
                                        <div className="flex-1 w-full sm:w-auto">
                                            <Input
                                                type="text"
                                                placeholder="Cost name"
                                                value={field.label}
                                                className="w-full sm:w-48 h-[40px] rounded-md text-sm sm:text-base"
                                                disabled
                                            />
                                        </div>
                                        <div className="flex-1 w-full sm:w-auto">
                                            <Input
                                                type="number"
                                                placeholder="0.00"
                                                value={field.value}
                                                onChange={(e) => handleDynamicFieldChange(field.id, e.target.value)}
                                                className="w-full sm:w-32 h-[40px] rounded-md text-sm sm:text-base"
                                                step="0.01"
                                                min="0"
                                            />
                                        </div>
                                        <Button
                                            type="text"
                                            danger
                                            onClick={() => handleDeleteField(field.id)}
                                            className="h-[40px] px-2 sm:px-4 text-sm sm:text-base"
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                ))}
                                <Button
                                    type="dashed"
                                    icon={<PlusOutlined />}
                                    onClick={showModal}
                                    className="h-[40px] text-sm sm:text-base"
                                >
                                    Add Fixed Cost
                                </Button>
                            </div>
                            {errors.fixedCosts && (
                                <span className="text-red-500 text-xs sm:text-sm">{errors.fixedCosts}</span>
                            )}
                        </div>
                    </div>
                </div>
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
                    <label className="text-sm sm:text-base font-medium">Cost Name</label>
                    <Input
                        placeholder="Enter cost name"
                        value={newFieldLabel}
                        onChange={(e) => setNewFieldLabel(e.target.value)}
                        className="h-[40px] text-sm sm:text-base"
                    />
                </div>
            </Modal>
        </div>
    );
}

export default FixedCost;