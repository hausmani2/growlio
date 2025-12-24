import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircleFilled, WarningFilled, CloseCircleFilled } from '@ant-design/icons';
import growlioLogo from "../../assets/svgs/growlio-logo.png"
const ProfitabilityResults = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { formData, scoreData } = location.state || {};

    if (!formData || !scoreData) {
        // If no data, redirect back to profitability page
        navigate('/profitability');
        return null;
    }

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-500';
        if (score >= 60) return 'text-yellow-500';
        return 'text-red-500';
    };

    const getScoreMessage = (score) => {
        if (score >= 80) return 'Excellent! Your restaurant is highly profitable.';
        if (score >= 60) return 'Good! There\'s room for improvement.';
        return 'Needs Attention. Let\'s work on improving your profitability.';
    };

    const getScoreIcon = (score) => {
        if (score >= 80) return <CheckCircleFilled className="text-6xl text-green-500" />;
        if (score >= 60) return <WarningFilled className="text-6xl text-yellow-500" />;
        return <CloseCircleFilled className="text-6xl text-red-500" />;
    };

    const getPercentageColor = (percentage, type) => {
        const value = parseFloat(percentage);
        if (type === 'cogs') {
            if (value <= 35) return 'text-green-600';
            if (value <= 40) return 'text-yellow-600';
            return 'text-red-600';
        }
        if (type === 'labor') {
            if (value <= 35) return 'text-green-600';
            if (value <= 40) return 'text-yellow-600';
            return 'text-red-600';
        }
        if (type === 'rent') {
            if (value <= 10) return 'text-green-600';
            if (value <= 15) return 'text-yellow-600';
            return 'text-red-600';
        }
        return 'text-gray-700';
    };

    return (
        <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden flex items-center justify-center bg-gray-50">
            {/* Content Section - Left Side */}
            <div className="w-full flex items-center justify-center px-4 sm:px-4 lg:px-6 py-8 lg:py-0 min-h-screen lg:min-h-0">
                <div className="w-full max-w-md mx-auto flex flex-col h-full justify-center">
                    <div className="flex flex-col gap-6 bg-white rounded-2xl shadow-lg p-6">
                        
                        {/* Growlio Logo */}
                        <div className="flex justify-center">
                            <img src={growlioLogo} alt="Growlio Logo" className="w-32 mx-auto" />
                        </div>

                        {/* Score Icon */}
                        <div className="flex justify-center">
                            {getScoreIcon(scoreData.score)}
                        </div>

                        {/* Main Score */}
                        <div className="text-center">
                            <h1 className="text-5xl font-bold mb-2 ${getScoreColor(scoreData.score)}">
                                {scoreData.score}
                            </h1>
                            <h2 className="text-2xl font-bold text-gray-900">
                                Your Profitability Score
                            </h2>
                            <p className="text-sm text-gray-600 mt-2">
                                {getScoreMessage(scoreData.score)}
                            </p>
                        </div>

                        {/* Breakdown */}
                        <div className="space-y-4 border-t border-gray-200 pt-6">
                            <h3 className="text-lg font-bold text-gray-900">Breakdown</h3>
                            
                            <div className="space-y-3">
                                {/* COGS Percentage */}
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-700 font-medium">Cost of Goods:</span>
                                    <span className={`text-lg font-bold ${getPercentageColor(scoreData.cogsPercentage, 'cogs')}`}>
                                        {scoreData.cogsPercentage}%
                                    </span>
                                </div>

                                {/* Labor Percentage */}
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-700 font-medium">Labor Cost:</span>
                                    <span className={`text-lg font-bold ${getPercentageColor(scoreData.laborPercentage, 'labor')}`}>
                                        {scoreData.laborPercentage}%
                                    </span>
                                </div>

                                {/* Rent Percentage */}
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-700 font-medium">Rent:</span>
                                    <span className={`text-lg font-bold ${getPercentageColor(scoreData.rentPercentage, 'rent')}`}>
                                        {scoreData.rentPercentage}%
                                    </span>
                                </div>

                                {/* Profit Margin */}
                                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                                    <span className="text-base text-gray-900 font-bold">Est. Profit Margin:</span>
                                    <span className={`text-xl font-bold ${parseFloat(scoreData.profitMargin) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {scoreData.profitMargin}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Recommendations */}
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                            <h4 className="text-sm font-bold text-orange-900 mb-2">💡 Recommendations</h4>
                            <ul className="text-xs text-gray-700 space-y-1">
                                {parseFloat(scoreData.cogsPercentage) > 35 && (
                                    <li>• Consider negotiating with suppliers to reduce COGS</li>
                                )}
                                {parseFloat(scoreData.laborPercentage) > 35 && (
                                    <li>• Review staffing levels and scheduling efficiency</li>
                                )}
                                {parseFloat(scoreData.rentPercentage) > 10 && (
                                    <li>• Rent is high relative to sales - focus on increasing revenue</li>
                                )}
                            </ul>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3 mt-4">
                            <button
                                onClick={() => navigate('/onboarding/basic-information')}
                                className="w-full rounded-lg p-3 bg-orange-500 text-white font-semibold text-base hover:bg-orange-600 transition-colors duration-200 shadow-md hover:shadow-lg"
                            >
                                Complete Restaurant Setup
                            </button>
                            <button
                                onClick={() => navigate('/profitability')}
                                className="w-full rounded-lg p-3 border border-gray-300 text-gray-700 font-semibold text-base hover:bg-gray-50 transition-colors duration-200"
                            >
                                Calculate Again
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfitabilityResults;

