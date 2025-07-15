import React from "react";
import LeftArrow from '../../../../../assets/svgs/left-arrow.svg';
import PrimaryBtn from "../../../../buttons/Buttons";


const TotalExpense = ({ data,  onSave }) => {
    
    // Calculate total expenses properly
    const calculateTotalExpenses = () => {
        const variableCost = parseFloat(data.totalVariableCost) || 0;
        const fixedCost = parseFloat(data.totalFixedCost) || 0;
        return (variableCost + fixedCost).toFixed(2);
    };
    
    const totalExpenses = calculateTotalExpenses();
       
    return (
        <div>
            <div className="flex mt-5">
                <div className="w-[40%]">
                    <div className="flex flex-col gap-2">
                        <h4 className="text-lg !font-bold !mb-0">Total Expenses</h4>
                        <span className="text-base text-neutral-600"></span>
                    </div>
                </div>
                <div className="w-[60%]">
                    <div className="flex flex-col gap-3 p-6 bg-white rounded-xl" >
                        <div className="flex items-center justify-between pt-4">
                            <label htmlFor="totalVariableCost" className="text-base !font-bold text-neutral-600">
                            Total Expenses:
                            </label>
                            <span className="text-base !font-bold ">
                                ${totalExpenses}
                            </span>
                        </div>
                        <div className="flex justify-between items-center my-5">
                         <PrimaryBtn icon={LeftArrow} title="Go Back" className="bg-gray-200 text-black h-[40px]"/>
                         <PrimaryBtn 
                             title="Save & Continue" 
                             className="btn-brand"
                         onClick={onSave}
                         />
                </div>
                        </div>
                        
                </div>
            </div>
        </div>
    )
}

export default TotalExpense;