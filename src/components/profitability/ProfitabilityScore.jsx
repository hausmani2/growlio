import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import growlioLogo from "../../assets/svgs/growlio-logo.png";
import PrimaryBtn from "../buttons/Buttons";
import ImageLayout from "../imageWrapper/ImageLayout";
import OnBoard from "../../assets/pngs/onBoard.png";
import { CheckOutlined } from '@ant-design/icons';

const ProfitabilityScore = () => {
    const navigate = useNavigate();
    const [showInfoModal, setShowInfoModal] = useState(false);

    const handleGetScore = () => {
        // Navigate to the profitability form or next step
        navigate('/onboarding/profitability');
    };

    const handleNoInfo = () => {
        // Handle the "What if I don't have this info?" link
        setShowInfoModal(true);
    };

    const requirements = [
        "Last Months Sales",
        "Last Months Cost of Goods (COGS)",
        "Last Months Labor Expense",
        "Your Monthly Rent"
    ];

    return (
        <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden flex items-center justify-center bg-gray-50">
            {/* Content Section - Left Side */}
            <div className="w-full flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 lg:py-0 min-h-screen lg:min-h-0 h-full">
                <div className="w-full max-w-xl mx-auto flex flex-col h-full justify-center">
                    <div className="flex flex-col gap-2 bg-white rounded-2xl shadow-lg p-6 py-16">
                        
                        {/* Growlio Logo */}
                        <div className="flex justify-center mb-4">
                            <img src={growlioLogo} alt="Growlio Logo" className="w-64 mx-auto" />
                        </div>

                        {/* Main Title */}
                        <div className="text-center mb-5">
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight mb-2">
                                Ready to get your
                            </h1>
                            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                                Profitability Score?
                            </h1>
                        </div>

                        {/* What You'll Need Section */}
                        <div className=" mb-5">
                            <h2 className="text-4xl font-bold text-gray-900 text-center">
                                What You'll Need:
                            </h2>
                            <p className="text-base text-gray-600 text-center">
                                The more you provide the better. At a minimum 1 month.
                            </p>

                            {/* Requirements List */}
                            <div className="mt-6 w-fit mx-auto flex flex-col gap-1">
                                {requirements.map((requirement, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                        <CheckOutlined
                                            className="text-green-500 text-xl flex-shrink-0"
                                        />
                                        <span className="text-base text-gray-900 font-medium text-left">
                                            {requirement}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Get My Score Button */}
                        <div className="">
                            <button
                                onClick={handleGetScore}
                                className="mx-auto flex items-center justify-center rounded-lg w-48 p-3 bg-orange-500 text-white font-semibold text-base hover:bg-orange-600 transition-colors duration-200 shadow-md hover:shadow-lg"
                            >
                                Get My Score!
                            </button>
                        </div>

                        {/* What if I don't have this info link */}
                        <div className="text-center">
                            <button
                                onClick={handleNoInfo}
                                className="text-sm text-gray-900 font-medium underline hover:text-orange-600 transition-colors duration-200"
                            >
                                What if I don't have this info?
                            </button>
                        </div>

                    </div>
                </div>
            </div>


            {/* Info Modal */}
            {showInfoModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg border border-gray-300 p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
                        {/* Title */}
                        <h2 className="text-3xl sm:text-4xl font-bold text-orange-500 mb-6 text-left">
                            Need help tracking your numbers?
                        </h2>
                        
                        {/* Content */}
                        <div className="space-y-4 text-gray-900 text-base leading-relaxed">
                            <p>
                                If you don't know your <strong>sales, food cost, labor, or rent</strong>, that's probably a big part of why things feel out of control. These four numbers alone can represent 70-80% of your total expenses, even when you are running profitably.
                            </p>
                            
                            <p>
                                They're the clearest indicators of whether your restaurant is healthy or slowly bleeding out. If you're not tracking them, you're basically operating blind and no marketing boost, new menu item, or lucky weekend is going to fix that.
                            </p>
                            
                            <p>
                                Growlio is here to help you take back control, but it starts with entering those numbers. If you don't have them handy yet, you can use hypothetical numbers just to see how the Report Card works. It's not ideal, but it'll show you exactly how the pieces connect.
                            </p>
                            
                            <p>
                                And if gathering your real numbers feels overwhelming, we can help. Reach out to us. We offer consulting support that can walk you through pulling your data, setting up simple tracking, and finally getting a clear picture of your profitability.
                            </p>
                            
                            <p>
                                Because until you measure these core costs, you're guessing, and guessing is the fastest way to fail.
                            </p>
                            
                            <p>
                                Growlio is here to make sure you stop guessing and start making smarter, more profitable decisions.
                            </p>
                        </div>
                        
                        {/* Close Button */}
                        <div className="mt-8 flex justify-end">
                            <button
                                onClick={() => setShowInfoModal(false)}
                                className="px-6 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfitabilityScore;

