import React, { useMemo } from "react";
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

    // Calculate weekly and monthly totals separately
    const { weeklyTotal, monthlyTotal } = useMemo(() => {
        const variableCost = parseFloat(data.totalVariableCost) || 0;
        const fixedCost = parseFloat(data.totalFixedCost) || 0;
        
        // Calculate weekly totals from dynamic fields
        const weeklyVariableTotal = (data.dynamicVariableFields || []).reduce((sum, field) => {
            if (field.variable_expense_type === 'weekly') {
                // Skip percentage fields (royalty/brand and fund) from total calculation
                const isPercentageField = ['royalty', 'brand', 'fund'].some(keyword => 
                    field.label.toLowerCase().includes(keyword)
                );
                if (!isPercentageField) {
                    return sum + parseFloat(field.value || 0);
                }
            }
            return sum;
        }, 0);

        const weeklyFixedTotal = (data.dynamicFixedFields || []).reduce((sum, field) => {
            if (field.fixed_expense_type === 'weekly') {
                return sum + parseFloat(field.value || 0);
            }
            return sum;
        }, 0);

        // Calculate monthly totals from dynamic fields
        const monthlyVariableTotal = (data.dynamicVariableFields || []).reduce((sum, field) => {
            if (field.variable_expense_type === 'monthly') {
                // Skip percentage fields (royalty/brand and fund) from total calculation
                const isPercentageField = ['royalty', 'brand', 'fund'].some(keyword => 
                    field.label.toLowerCase().includes(keyword)
                );
                if (!isPercentageField) {
                    return sum + parseFloat(field.value || 0);
                }
            }
            return sum;
        }, 0);

        const monthlyFixedTotal = (data.dynamicFixedFields || []).reduce((sum, field) => {
            if (field.fixed_expense_type === 'monthly') {
                return sum + parseFloat(field.value || 0);
            }
            return sum;
        }, 0);

        const weeklyTotal = (weeklyVariableTotal + weeklyFixedTotal).toFixed(2);
        const monthlyTotal = (monthlyVariableTotal + monthlyFixedTotal).toFixed(2);

        return { weeklyTotal, monthlyTotal };
    }, [data.dynamicVariableFields, data.dynamicFixedFields]);

    const handleBack = () => {
        handleTabClick(3);
    };
       
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
            <div className="bg-gray-50 p-4 rounded-lg flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <label className="text-base font-semibold text-gray-700">
                            Total Weekly Expenses:
                        </label>
                        <TooltipIcon text={tooltips['total_weekly_expense']} />
                    </div>
                    <span className="text-2xl font-bold text-gray-900">
                        ${weeklyTotal}
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <label className="text-base font-semibold text-gray-700">
                            Total Monthly Expenses:
                        </label>
                        <TooltipIcon text={tooltips['total_monthly_expense']} />
                    </div>
                    <span className="text-2xl font-bold text-gray-900">
                        ${monthlyTotal}
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