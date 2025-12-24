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
        navigate('/profitability/form');
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


            {/* Info Modal (optional - you can style this as needed) */}
            {showInfoModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">
                            Don't Have This Info?
                        </h3>
                        <p className="text-gray-700 mb-4">
                            No worries! You can still get started with Growlio. We'll help you set up your restaurant and guide you through collecting this information as you go.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowInfoModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                            >
                                Go Back
                            </button>
                            <button
                                onClick={() => {
                                    setShowInfoModal(false);
                                    navigate('/onboarding/basic-information');
                                }}
                                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
                            >
                                Continue Setup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfitabilityScore;

