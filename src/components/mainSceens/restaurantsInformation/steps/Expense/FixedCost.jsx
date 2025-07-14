import React, { useEffect } from "react";
import { Select } from "antd";

const FixedCost = ({ data, updateData }) => {
    // Calculate total fixed cost whenever any input changes
    useEffect(() => {
        const total = (
            parseFloat(data.bankFees || 0) +
            parseFloat(data.insurance || 0) +
            parseFloat(data.interestExpense || 0) +
            parseFloat(data.rent || 0) +
            parseFloat(data.utilities || 0)
        );
        updateData('totalFixedCost', total.toFixed(2));
    }, [data.bankFees, data.insurance, data.interestExpense, data.rent, data.utilities, updateData]);
    return (
        <div>
            <div className="flex mt-5">
                <div className="w-[40%]">
                    <div className="flex flex-col gap-2">
                        <h4 className="text-[26px] !font-bold !mb-0">Fixed Cost</h4>
                        <span className="text-[22px] text-neutral-600"></span>
                    </div>
                </div>
                <div className="w-[60%]">
                    <div className="flex flex-col gap-6 p-6 bg-white rounded-xl" >
                        <div className="flex flex-col gap-2">
                            <label htmlFor="bankFees" className="text-[20px] !font-bold text-neutral-600">Bank Fees</label>
                            <input 
                                type="number" 
                                id="bankFees" 
                                placeholder="Enter Bank Fees" 
                                className="w-full p-2 border border-gray-300 h-[60px] rounded-md text-[18px] font-normal text-neutral-700"
                                value={data.bankFees}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (value === '' || parseFloat(value) >= 0) {
                                        updateData('bankFees', value);
                                    }
                                }}
                                min="0"
                                onKeyDown={(e) => {
                                    if (e.key === '-') {
                                        e.preventDefault();
                                    }
                                }}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label htmlFor="insurance" className="text-[20px] !font-bold text-neutral-600">Insurance</label>
                            <input 
                                type="number" 
                                id="insurance" 
                                placeholder="Enter Insurance" 
                                className="w-full p-2 border border-gray-300 h-[60px] rounded-md text-[18px] font-normal text-neutral-700"
                                value={data.insurance}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (value === '' || parseFloat(value) >= 0) {
                                        updateData('insurance', value);
                                    }
                                }}
                                min="0"
                                onKeyDown={(e) => {
                                    if (e.key === '-') {
                                        e.preventDefault();
                                    }
                                }}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label htmlFor="interestExpense" className="text-[20px] !font-bold text-neutral-600">Interest Expense</label>
                            <input 
                                type="number" 
                                id="interestExpense" 
                                placeholder="Enter Interest Expense" 
                                className="w-full p-2 border border-gray-300 h-[60px] rounded-md text-[18px] font-normal text-neutral-700"
                                value={data.interestExpense}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (value === '' || parseFloat(value) >= 0) {
                                        updateData('interestExpense', value);
                                    }
                                }}
                                min="0"
                                onKeyDown={(e) => {
                                    if (e.key === '-') {
                                        e.preventDefault();
                                    }
                                }}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label htmlFor="rent" className="text-[20px] !font-bold text-neutral-600">Rent</label>
                            <input 
                                type="number" 
                                id="rent" 
                                placeholder="Enter Rent" 
                                className="w-full p-2 border border-gray-300 h-[60px] rounded-md text-[18px] font-normal text-neutral-700"
                                value={data.rent}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (value === '' || parseFloat(value) >= 0) {
                                        updateData('rent', value);
                                    }
                                }}
                                min="0"
                                onKeyDown={(e) => {
                                    if (e.key === '-') {
                                        e.preventDefault();
                                    }
                                }}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label htmlFor="utilities" className="text-[20px] !font-bold text-neutral-600">Utilities</label>
                            <input 
                                type="number" 
                                id="utilities" 
                                placeholder="Enter Utilities" 
                                className="w-full p-2 border border-gray-300 h-[60px] rounded-md text-[18px] font-normal text-neutral-700"
                                value={data.utilities}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (value === '' || parseFloat(value) >= 0) {
                                        updateData('utilities', value);
                                    }
                                }}
                                min="0"
                                onKeyDown={(e) => {
                                    if (e.key === '-') {
                                        e.preventDefault();
                                    }
                                }}
                            />
                        </div>
                        <div className="flex items-center justify-between ">
                            <label htmlFor="other" className="text-[20px] !font-bold text-neutral-600">Total Fixed Cost</label>
                            <span className="text-[20px] !font-bold text-neutral-600">${data.totalFixedCost || '0.00'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default FixedCost;