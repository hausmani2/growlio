
import React, { useState, useCallback } from "react";
import FixedCost from "./FixedCost";
import VariableFixed from "./VariableFixed";
import { useNavigate } from "react-router-dom";
import TotalExpense from "./TotalExpense";
import { TabProvider } from "../../TabContext";

const ExpenseWrapper = () => {
    const navigate = useNavigate();
    // State for expense data
    const [expenseData, setExpenseData] = useState({
        // Fixed costs
        bankFees: "",
        insurance: "",
        interestExpense: "",
        rent: "",
        utilities: "",
        totalFixedCost: "0.00",
        
        // Variable costs
        accountingLegal: "",
        advertising: "",
        adyenFees: "",
        duesAndSubscriptions: "",
        mealsAndEntertainment: "",
        medicalBenefits: "",
        officeExpenses: "",
        repairsAndMaintenance: "",
        royalty: "",
        brandFund: "",
        telephoneAndInternet: "",
        travel: "",
        taxes: "",
        totalVariableCost: "0.00"
    });

    const updateExpenseData = useCallback((field, value) => {
        setExpenseData(prev => {
            // Only update if the value has actually changed
            if (prev[field] === value) {
                return prev;
            }
            return {
                ...prev,
                [field]: value
            };
        });
    }, []);

    // Handle save functionality
    const handleSave = () => {
        navigate("/complete-steps");
        
        console.log("=== EXPENSE DATA SAVED ===");
        console.log("📊 Fixed Costs:");
        console.log("  • Bank Fees:", expenseData.bankFees || "0");
        console.log("  • Insurance:", expenseData.insurance || "0");
        console.log("  • Interest Expense:", expenseData.interestExpense || "0");
        console.log("  • Rent:", expenseData.rent || "0");
        console.log("  • Utilities:", expenseData.utilities || "0");
        console.log("  • Total Fixed Cost:", expenseData.totalFixedCost || "0.00");
        
        console.log("\n📈 Variable Costs:");
        console.log("  • Accounting & Legal:", expenseData.accountingLegal || "0");
        console.log("  • Advertising:", expenseData.advertising || "0");
        console.log("  • Adyen Fees:", expenseData.adyenFees || "0");
        console.log("  • Dues and Subscriptions:", expenseData.duesAndSubscriptions || "0");
        console.log("  • Meals and Entertainment:", expenseData.mealsAndEntertainment || "0");
        console.log("  • Medical Benefits:", expenseData.medicalBenefits || "0");
        console.log("  • Office Expenses:", expenseData.officeExpenses || "0");
        console.log("  • Repairs and Maintenance:", expenseData.repairsAndMaintenance || "0");
        console.log("  • Royalty:", expenseData.royalty || "0");
        console.log("  • Brand / Advertising Fund:", expenseData.brandFund || "0");
        console.log("  • Telephone & Internet:", expenseData.telephoneAndInternet || "0");
        console.log("  • Travel:", expenseData.travel || "0");
        console.log("  • WSIB / Taxes:", expenseData.taxes || "0");
        console.log("  • Total Variable Cost:", expenseData.totalVariableCost || "0.00");
        
        console.log("\n💰 SUMMARY:");
        const totalFixed = parseFloat(expenseData.totalFixedCost) || 0;
        const totalVariable = parseFloat(expenseData.totalVariableCost) || 0;
        const grandTotal = totalFixed + totalVariable;
        console.log("  • Total Fixed Cost: $", totalFixed.toFixed(2));
        console.log("  • Total Variable Cost: $", totalVariable.toFixed(2));
        console.log("  • Grand Total: $", grandTotal.toFixed(2));
        console.log("==========================");
    };

    return (
        <TabProvider>
            <div>
                <div className="flex flex-col h-[80vh]">
                    <FixedCost data={expenseData} updateData={updateExpenseData} />
                    <VariableFixed data={expenseData} updateData={updateExpenseData} onSave={handleSave} />
                    <TotalExpense data={expenseData} onSave={handleSave} />
                </div>
            </div>
        </TabProvider>
    )
}

export default ExpenseWrapper;