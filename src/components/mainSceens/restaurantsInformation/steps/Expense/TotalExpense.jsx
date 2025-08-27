import React from "react";
import LeftArrow from '../../../../../assets/svgs/left-arrow.svg';
import PrimaryBtn from "../../../../buttons/Buttons";
import { useTabHook } from "../../useTabHook";
import { useLocation } from 'react-router-dom';
import TooltipIcon from "../../../../common/TooltipIcon";
import useTooltips from "../../../../../utils/useTooltips";


const TotalExpense = ({ data,  onSave }) => {
    const location = useLocation();
    const { handleTabClick } = useTabHook();
    const tooltips = useTooltips('onboarding-expense');
    
    // Check if this is update mode (accessed from sidebar) or onboarding mode
    const isUpdateMode = !location.pathname.includes('/onboarding');

    // Calculate total expenses properly
    const calculateTotalExpenses = () => {
        const variableCost = parseFloat(data.totalVariableCost) || 0;
        const fixedCost = parseFloat(data.totalFixedCost) || 0;
        const total = (variableCost + fixedCost).toFixed(2);
        
        // Debug logging
        console.log('TotalExpense Debug:', {
            totalVariableCost: data.totalVariableCost,
            totalFixedCost: data.totalFixedCost,
            variableCost,
            fixedCost,
            total
        });
        
        return total;
    };
    const handleBack = () => {
        handleTabClick(3);
    };
    const totalExpenses = calculateTotalExpenses();
       
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            {/* Header Section */}
            <div className="mb-6">
                <h3 className="text-xl font-bold text-orange-600">Total Expenses</h3>
                <p className="text-gray-600 text-sm">
                   Your total expenses are calculated by adding your variable and fixed costs.
                </p>
            </div>
            
            {/* Total Display */}
            <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <label className="text-base font-semibold text-gray-700">
                            Total Expenses:
                        </label>
                        <TooltipIcon text={tooltips['total_expense']} />
                    </div>
                    <span className="text-2xl font-bold text-gray-900">
                        ${totalExpenses}
                    </span>
                </div>
            </div>
            
            {/* Navigation Buttons */}
            {!isUpdateMode && (
                <div className="flex justify-between items-center mt-6 pt-6">
                    <PrimaryBtn 
                        icon={LeftArrow} 
                        title="Go Back" 
                        className="bg-gray-200 text-black h-11" 
                        onClick={handleBack} 
                    />
                    <PrimaryBtn 
                        title="Save & Continue" 
                        className="btn-brand h-11"
                        onClick={onSave}
                    />
                </div>
            )}
        </div>
    )
}

export default TotalExpense;