import React, { useEffect, useCallback } from "react";

// Reusable input component for consistent styling and validation
const NumberInput = ({ 
    id, 
    label, 
    placeholder, 
    value, 
    onChange, 
    className = "" 
}) => {
    const handleChange = useCallback((e) => {
        const value = e.target.value;
        // Allow empty string or non-negative numbers only
        if (value === '' || parseFloat(value) >= 0) {
            onChange(value);
        }
    }, [onChange]);

    const handleKeyDown = useCallback((e) => {
        // Prevent minus key from being typed
        if (e.key === '-') {
            e.preventDefault();
        }
    }, []);

    return (
        <div className="flex flex-col gap-2">
            <label htmlFor={id} className="text-[20px] !font-bold text-neutral-600">
                {label}
            </label>
            <input
                type="number"
                id={id}
                placeholder={placeholder}
                className={`w-full p-2 border border-gray-300 h-[60px] rounded-md text-[18px] font-normal text-neutral-700 ${className}`}
                value={value || ''}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                min="0"
                step="0.01"
            />
        </div>
    );
};

const VariableFixed = ({ data, updateData }) => {
    // Define all variable cost fields
    const variableCostFields = [
        { id: 'accountingLegal', label: 'Accounting & Legal', placeholder: 'Enter Accounting & Legal' },
        { id: 'advertising', label: 'Advertising', placeholder: 'Enter Advertising' },
        { id: 'adyenFees', label: 'Adyen Fees', placeholder: 'Enter Adyen Fees' },
        { id: 'duesAndSubscriptions', label: 'Dues and Subscriptions', placeholder: 'Enter Dues and Subscriptions' },
        { id: 'mealsAndEntertainment', label: 'Meals and Entertainment', placeholder: 'Enter Meals and Entertainment' },
        { id: 'medicalBenefits', label: 'Medical Benefits', placeholder: 'Enter Medical Benefits' },
        { id: 'officeExpenses', label: 'Office Expenses', placeholder: 'Enter Office Expenses' },
        { id: 'repairsAndMaintenance', label: 'Repairs and Maintenance', placeholder: 'Enter Repairs and Maintenance' },
        { id: 'royalty', label: 'Royalty', placeholder: 'Enter Royalty' },
        { id: 'brandFund', label: 'Brand / Advertising Fund', placeholder: 'Enter Brand / Advertising Fund' },
        { id: 'telephoneAndInternet', label: 'Telephone & Internet', placeholder: 'Enter Telephone & Internet' },
        { id: 'travel', label: 'Travel', placeholder: 'Enter Travel' },
        { id: 'taxes', label: 'WSIB / Taxes', placeholder: 'Enter WSIB / Taxes' }
    ];

    // Calculate total variable cost whenever any input changes
    useEffect(() => {
        const total = variableCostFields.reduce((sum, field) => {
            const value = parseFloat(data[field.id]) || 0;
            return sum + value;
        }, 0);
        
        updateData('totalVariableCost', total.toFixed(2));
    }, [data, updateData]);

    // Handle input changes
    const handleInputChange = useCallback((fieldId, value) => {
        updateData(fieldId, value);
    }, [updateData]);

    return (
        <div className="mt-5">
            <div className="flex">
                {/* Header Section */}
                <div className="w-[40%]">
                    <div className="flex flex-col gap-2">
                        <h4 className="text-[26px] !font-bold !mb-0">Variable Cost</h4>
                        <span className="text-[22px] text-neutral-600">
                            Track your variable business expenses
                        </span>
                    </div>
                </div>

                {/* Form Section */}
                <div className="w-[60%]">
                    <div className="flex flex-col gap-6 p-6 bg-white rounded-xl ">
                        {/* Dynamic input fields */}
                        {variableCostFields.map((field) => (
                            <NumberInput
                                key={field.id}
                                id={field.id}
                                label={field.label}
                                placeholder={field.placeholder}
                                value={data[field.id]}
                                onChange={(value) => handleInputChange(field.id, value)}
                            />
                        ))}

                        {/* Total Section */}
                        <div className="flex items-center justify-between pt-4">
                            <label htmlFor="totalVariableCost" className="text-[20px] !font-bold text-neutral-600">
                                Total Variable Cost
                            </label>
                            <span className="text-[20px] !font-bold ">
                                ${data.totalVariableCost || '0.00'}
                            </span>
                        </div>
                        
                     
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VariableFixed;