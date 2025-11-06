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

    // Calculate weekly and monthly totals with proper conversion
    const { weeklyTotal, monthlyTotal } = useMemo(() => {
        // Conversion factor: 4.33 weeks per month (52 weeks ÷ 12 months)
        const WEEKS_PER_MONTH = 4.33;
        
        // Calculate total monthly expenses by converting all expenses to monthly
        const totalMonthlyExpenses = (data.dynamicVariableFields || []).reduce((sum, field) => {
            // Skip percentage fields (royalty/brand and fund) from total calculation
            const isPercentageField = ['royalty', 'brand', 'fund'].some(keyword => 
                field.label.toLowerCase().includes(keyword)
            );
            if (isPercentageField) {
                return sum;
            }
            
            const value = parseFloat(field.value || 0);
            if (field.variable_expense_type === 'weekly') {
                // Convert weekly to monthly: weekly * 4.33
                return sum + (value * WEEKS_PER_MONTH);
            } else {
                // Already monthly
                return sum + value;
            }
        }, 0) + (data.dynamicFixedFields || []).reduce((sum, field) => {
            const value = parseFloat(field.value || 0);
            if (field.fixed_expense_type === 'weekly') {
                // Convert weekly to monthly: weekly * 4.33
                return sum + (value * WEEKS_PER_MONTH);
            } else {
                // Already monthly
                return sum + value;
            }
        }, 0);

        // Calculate total weekly expenses by converting all expenses to weekly
        const totalWeeklyExpenses = (data.dynamicVariableFields || []).reduce((sum, field) => {
            // Skip percentage fields (royalty/brand and fund) from total calculation
            const isPercentageField = ['royalty', 'brand', 'fund'].some(keyword => 
                field.label.toLowerCase().includes(keyword)
            );
            if (isPercentageField) {
                return sum;
            }
            
            const value = parseFloat(field.value || 0);
            if (field.variable_expense_type === 'monthly') {
                // Convert monthly to weekly: monthly ÷ 4.33
                return sum + (value / WEEKS_PER_MONTH);
            } else {
                // Already weekly
                return sum + value;
            }
        }, 0) + (data.dynamicFixedFields || []).reduce((sum, field) => {
            const value = parseFloat(field.value || 0);
            if (field.fixed_expense_type === 'monthly') {
                // Convert monthly to weekly: monthly ÷ 4.33
                return sum + (value / WEEKS_PER_MONTH);
            } else {
                // Already weekly
                return sum + value;
            }
        }, 0);

        const weeklyTotal = totalWeeklyExpenses.toFixed(2);
        const monthlyTotal = totalMonthlyExpenses.toFixed(2);

        return { weeklyTotal, monthlyTotal };
    }, [data.dynamicVariableFields, data.dynamicFixedFields]);

    const handleBack = () => {
        handleTabClick(3);
    };
       
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            {/* Header Section */}
            <div className="mb-6" data-guidance="total_expense_title">
                <h3 className="text-xl font-bold text-orange-600">Total Expenses</h3>
                <p className="text-gray-600 text-sm">
                   Your total expenses are calculated by adding your variable and fixed costs.
                </p>
            </div>
            
            {/* Total Display */}
            <div className="bg-gray-50 p-4 rounded-lg flex flex-col gap-4" data-guidance="total_expense_display">
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
                        data-guidance="expense_continue_button"
                    />
                </div>
            )}
        </div>
    )
}

export default TotalExpense;