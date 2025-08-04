import React, { useEffect, useState, useCallback } from "react";
import { Button, Modal, Input } from "antd";
import { PlusOutlined } from "@ant-design/icons";

const VariableFixed = ({ data, updateData, errors = {} }) => {
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
                key: `dynamic_variable_${Date.now()}_${Math.random()}`
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
        if (value === '' || parseFloat(value) >= 0) {
            const updatedFields = dynamicFields.map(field => 
                field.id === id ? { ...field, value } : field
            );
            setDynamicFields(updatedFields);
            
            // Update parent with new fields
            memoizedUpdateData('dynamicVariableFields', updatedFields);
            
            // Calculate and update total
            const dynamicTotal = updatedFields.reduce((sum, field) => {
                return sum + parseFloat(field.value || 0);
            }, 0);
            memoizedUpdateData('totalVariableCost', dynamicTotal.toFixed(2));
        }
    };

    const handleDeleteField = (id) => {
        const updatedFields = dynamicFields.filter(field => field.id !== id);
        setDynamicFields(updatedFields);
        
        // Update parent with new fields
        memoizedUpdateData('dynamicVariableFields', updatedFields);
        
        // Calculate and update total
        const dynamicTotal = updatedFields.reduce((sum, field) => {
            return sum + parseFloat(field.value || 0);
        }, 0);
        memoizedUpdateData('totalVariableCost', dynamicTotal.toFixed(2));
    };

    return (
        <div>
            <div className="flex mt-5">
                <div className="w-[40%]">
                    <div className="flex flex-col gap-2">
                        <h4 className="text-lg !font-bold !mb-0">Variable Cost</h4>
                        <span className="text-base text-neutral-600">
                            What are the variable costs for this location?
                            Add a new field to add a variable cost.
                        </span>
                    </div>
                </div>
                <div className="w-[60%]">
                    <div className="flex flex-col gap-3 p-6 bg-white rounded-xl" >

                        {/* Dynamic Fields */}
                        {dynamicFields.map((field, index) => (
                            <div key={field.id} className="flex items-center justify-between gap-2">
                                <label htmlFor={field.key} className="w-1/4 text-base !font-bold text-neutral-600">
                                    {field.label.charAt(0).toUpperCase() + field.label.slice(1)}
                                </label>
                                <div className="flex items-center gap-2 w-full">
                                    <div className="relative w-full">
                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base font-normal text-neutral-700">$</span>
                                        <Input 
                                            type="number" 
                                            id={field.key} 
                                            placeholder={`Enter ${field.label}`} 
                                            className={`w-full p-2 pl-8 border h-[40px] rounded-md text-[18px] font-normal text-neutral-700 ${errors[`dynamic_variable_${index}_amount`] ? 'border-red-500' : 'border-gray-300'}`}
                                            value={field.value}
                                            onChange={(e) => handleDynamicFieldChange(field.id, e.target.value)}
                                            min="0"
                                            onKeyDown={(e) => {
                                                if (e.key === '-') {
                                                    e.preventDefault();
                                                }
                                            }}
                                            status={errors[`dynamic_variable_${index}_amount`] ? 'error' : ''}
                                        />
                                    </div>
                                    <button 
                                        className="text-base !font-bold text-neutral-600 cursor-pointer !text-red-500"
                                        onClick={() => handleDeleteField(field.id)}
                                    >
                                        Delete
                                    </button>
                                </div>
                                {errors[`dynamic_variable_${index}_amount`] && (
                                    <div className="w-full mt-1">
                                        <span className="text-red-500 text-sm">{errors[`dynamic_variable_${index}_amount`]}</span>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Show message when no fields are added */}
                        {dynamicFields.length === 0 && (
                            <div className="text-center py-4 text-gray-500">
                                <p className="text-sm">No variable costs added yet. Click the + button to add your first expense.</p>
                            </div>
                        )}

                        {/* Show specific error message for missing variable costs */}
                        {errors.no_variable_costs && (
                            <div className="text-center py-2">
                                <span className="text-red-500 text-sm font-semibold">{errors.no_variable_costs}</span>
                            </div>
                        )}

                        {/* Show general error message */}
                        {errors.no_expenses && !errors.no_variable_costs && (
                            <div className="text-center py-2">
                                <span className="text-red-500 text-sm">{errors.no_expenses}</span>
                            </div>
                        )}

                        <div className="flex justify-end">
                            <Button className="" onClick={showModal}><PlusOutlined /></Button>
                        </div>
                       
                        <div className="flex items-center justify-between ">
                            <label htmlFor="other" className="text-base !font-bold text-neutral-600">Total Variable Cost</label>
                            <span className="text-base !font-bold text-neutral-600">${data.totalVariableCost || '0.00'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal for adding new fields */}
            <Modal
                title=""
                open={isModalVisible}
                onOk={handleOk}
                onCancel={handleCancel}
                okText="Add"
                cancelText="Cancel"
            >
                <div className="flex flex-col gap-4">
                    <label htmlFor="fieldLabel" className="text-base font-semibold text-neutral-600">
                        Add Variable Cost
                        <span className="text-red-500">*</span>
                    </label>
                    <Input
                        id="fieldLabel"
                        placeholder="Enter Variable Cost Name"
                        value={newFieldLabel}
                        onChange={(e) => setNewFieldLabel(e.target.value)}
                        onPressEnter={handleOk}
                        className={newFieldLabel.trim().length > 0 && newFieldLabel.trim().length < 2 ? 'border-red-500' : ''}
                        status={newFieldLabel.trim().length > 0 && newFieldLabel.trim().length < 2 ? 'error' : ''}
                    />
                    {newFieldLabel.trim().length > 0 && newFieldLabel.trim().length < 2 && (
                        <span className="text-red-500 text-sm">Field name must be at least 2 characters</span>
                    )}
                </div>
            </Modal>
        </div>
    )
};

export default VariableFixed;