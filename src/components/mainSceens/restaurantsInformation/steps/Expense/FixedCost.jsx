import React, { useEffect, useState } from "react";
import { Button, Modal, Input } from "antd";
import { PlusOutlined } from "@ant-design/icons";

const FixedCost = ({ data, updateData }) => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [newFieldLabel, setNewFieldLabel] = useState("");
    const [dynamicFields, setDynamicFields] = useState(data.dynamicFixedFields || []);

    // Update local state when data prop changes (when API data is loaded)
    useEffect(() => {
        if (data.dynamicFixedFields && data.dynamicFixedFields.length > 0) {
            setDynamicFields(data.dynamicFixedFields);
        }
    }, [data.dynamicFixedFields]);

    // Update parent component when dynamic fields change
    useEffect(() => {
        updateData('dynamicFixedFields', dynamicFields);
    }, [dynamicFields, updateData]);

    // Calculate total fixed cost from dynamic fields only
    useEffect(() => {
        const dynamicTotal = dynamicFields.reduce((sum, field) => {
            return sum + parseFloat(field.value || 0);
        }, 0);
        
        updateData('totalFixedCost', dynamicTotal.toFixed(2));
    }, [dynamicFields, updateData]);

    const showModal = () => {
        setIsModalVisible(true);
    };

    const handleOk = () => {
        if (newFieldLabel.trim()) {
            const newField = {
                id: Date.now() + Math.random(),
                label: newFieldLabel.trim(),
                value: "",
                key: `dynamic_fixed_${Date.now()}_${Math.random()}`
            };
            setDynamicFields([...dynamicFields, newField]);
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
            setDynamicFields(prev => 
                prev.map(field => 
                    field.id === id ? { ...field, value } : field
                )
            );
        }
    };

    const handleDeleteField = (id) => {
        setDynamicFields(prev => prev.filter(field => field.id !== id));
    };

    return (
        <div>
            <div className="flex mt-5">
                <div className="w-[40%]">
                    <div className="flex flex-col gap-2">
                        <h4 className="text-lg !font-bold !mb-0">Fixed Cost</h4>
                        <span className="text-base text-neutral-600">
                            What are the fixed costs for this location?
                            Add a new field to add a fixed cost.
                        </span>
                    </div>
                </div>
                <div className="w-[60%]">
                    <div className="flex flex-col gap-3 p-6 bg-white rounded-xl" >
                        
                        {/* Dynamic Fields */}
                        {dynamicFields.map((field) => (
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
                                            className="w-full p-2 pl-8 border border-gray-300 h-[40px] rounded-md text-[18px] font-normal text-neutral-700"
                                            value={field.value}
                                            onChange={(e) => handleDynamicFieldChange(field.id, e.target.value)}
                                            min="0"
                                            onKeyDown={(e) => {
                                                if (e.key === '-') {
                                                    e.preventDefault();
                                                }
                                            }}
                                        />
                                    </div>
                                    <button 
                                        className="text-[20px] !font-bold text-neutral-600 cursor-pointer !text-red-500"
                                        onClick={() => handleDeleteField(field.id)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* Show message when no fields are added */}
                        {dynamicFields.length === 0 && (
                            <div className="text-center py-4 text-gray-500">
                                <p className="text-sm">No fixed costs added yet. Click the + button to add your first expense.</p>
                            </div>
                        )}

                        <div className="flex justify-end">
                            <Button className="" onClick={showModal}><PlusOutlined /></Button>
                            </div>
                       
                        <div className="flex items-center justify-between ">
                            <label htmlFor="other" className="text-base !font-bold text-neutral-600">Total Fixed Cost</label>
                            <span className="text-base !font-bold text-neutral-600">${data.totalFixedCost || '0.00'}</span>
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
                        Add Fixed Cost
                    </label>
                    <Input
                        id="fieldLabel"
                        placeholder="Enter Fixed Cost Name"
                        value={newFieldLabel}
                        onChange={(e) => setNewFieldLabel(e.target.value)}
                        onPressEnter={handleOk}
                    />
                </div>
            </Modal>
        </div>
    )
}

export default FixedCost;