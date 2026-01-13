import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input, message } from "antd";
import GrowlioLogo from "../common/GrowlioLogo";
import ImageLayout from "../imageWrapper/ImageLayout";
import Mask from "../../assets/pngs/new-onboard.png";
import { FaArrowLeftLong } from "react-icons/fa6";
import growlioLogo from "../../assets/svgs/growlio-logo.png"
const ProfitabilityForm = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        lastMonthSales: '',
        lastMonthCOGS: '',
        lastMonthLabor: '',
        monthlyRent: ''
    });

    const [errors, setErrors] = useState({});

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        // Clear error for this field when user starts typing
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: null
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.lastMonthSales || parseFloat(formData.lastMonthSales) <= 0) {
            newErrors.lastMonthSales = "Last month's sales is required";
        }
        if (!formData.lastMonthCOGS || parseFloat(formData.lastMonthCOGS) <= 0) {
            newErrors.lastMonthCOGS = "Last month's COGS is required";
        }
        if (!formData.lastMonthLabor || parseFloat(formData.lastMonthLabor) <= 0) {
            newErrors.lastMonthLabor = "Last month's labor expense is required";
        }
        if (!formData.monthlyRent || parseFloat(formData.monthlyRent) <= 0) {
            newErrors.monthlyRent = "Monthly rent is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const calculateProfitabilityScore = () => {
        const sales = parseFloat(formData.lastMonthSales);
        const cogs = parseFloat(formData.lastMonthCOGS);
        const labor = parseFloat(formData.lastMonthLabor);
        const rent = parseFloat(formData.monthlyRent);

        // Calculate percentages
        const cogsPercentage = (cogs / sales) * 100;
        const laborPercentage = (labor / sales) * 100;
        const rentPercentage = (rent / sales) * 100;
        const totalExpensePercentage = cogsPercentage + laborPercentage + rentPercentage;
        const profitMargin = 100 - totalExpensePercentage;

        // Simple scoring logic (you can adjust this)
        let score = 100;
        
        // Ideal COGS: 25-35%
        if (cogsPercentage > 35) score -= (cogsPercentage - 35) * 2;
        if (cogsPercentage < 25) score -= (25 - cogsPercentage);
        
        // Ideal Labor: 25-35%
        if (laborPercentage > 35) score -= (laborPercentage - 35) * 2;
        if (laborPercentage < 25) score -= (25 - laborPercentage);
        
        // Ideal Rent: 5-10%
        if (rentPercentage > 10) score -= (rentPercentage - 10) * 3;
        
        score = Math.max(0, Math.min(100, score));

        return {
            score: Math.round(score),
            cogsPercentage: cogsPercentage.toFixed(1),
            laborPercentage: laborPercentage.toFixed(1),
            rentPercentage: rentPercentage.toFixed(1),
            profitMargin: profitMargin.toFixed(1)
        };
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            message.error("Please fill in all required fields");
            return;
        }

        setLoading(true);
        
        try {
            // Calculate the score
            const scoreData = calculateProfitabilityScore();
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Navigate to results page with score data
            navigate('/dashboard/profitability/results', { 
                state: { 
                    formData,
                    scoreData 
                } 
            });
            
        } catch (error) {
            console.error("Error calculating score:", error);
            message.error("Failed to calculate profitability score. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoBack = () => {
        navigate('/dashboard/profitability');
    };

    return (
        <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden flex items-center justify-center bg-gray-50">
            {/* Content Section - Left Side */}
            <div className="w-full flex items-center justify-center px-4 sm:px-4 lg:px-6 py-8 lg:py-0 min-h-screen lg:min-h-0">
                <div className="w-full max-w-md mx-auto flex flex-col h-full justify-center">
                    <div className="flex flex-col gap-6 bg-white rounded-2xl shadow-lg p-6">
                        
                        {/* Back Button */}
                        <button 
                            onClick={handleGoBack} 
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors duration-200 font-medium self-start"
                        >
                            <FaArrowLeftLong className="text-sm" />
                            <span>Go Back</span>
                        </button>

                        {/* Growlio Logo */}
                        <div className="flex justify-center">
                            <img src={growlioLogo} alt="Growlio Logo" className="w-32 mx-auto" />
                        </div>

                        {/* Main Title */}
                        <div className="text-center">
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                                Enter Your Restaurant Data
                            </h1>
                            <p className="text-sm text-gray-600 mt-2">
                                Provide your last month's financial information
                            </p>
                        </div>

                        {/* Form Fields */}
                        <div className="space-y-4">
                            {/* Last Month Sales */}
                            <div>
                                <label htmlFor="lastMonthSales" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Last Month's Sales <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        id="lastMonthSales"
                                        placeholder="Enter sales amount"
                                        className={`w-full h-11 rounded-lg text-sm pl-6 ${
                                            errors.lastMonthSales ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        value={formData.lastMonthSales}
                                        onChange={(e) => handleInputChange('lastMonthSales', e.target.value)}
                                        status={errors.lastMonthSales ? 'error' : ''}
                                    />
                                    {formData.lastMonthSales && (
                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                                            $
                                        </span>
                                    )}
                                </div>
                                {errors.lastMonthSales && (
                                    <span className="text-red-500 text-xs mt-1">{errors.lastMonthSales}</span>
                                )}
                            </div>

                            {/* Last Month COGS */}
                            <div>
                                <label htmlFor="lastMonthCOGS" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Last Month's Cost of Goods (COGS) <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        id="lastMonthCOGS"
                                        placeholder="Enter COGS amount"
                                        className={`w-full h-11 rounded-lg text-sm pl-6 ${
                                            errors.lastMonthCOGS ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        value={formData.lastMonthCOGS}
                                        onChange={(e) => handleInputChange('lastMonthCOGS', e.target.value)}
                                        status={errors.lastMonthCOGS ? 'error' : ''}
                                    />
                                    {formData.lastMonthCOGS && (
                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                                            $
                                        </span>
                                    )}
                                </div>
                                {errors.lastMonthCOGS && (
                                    <span className="text-red-500 text-xs mt-1">{errors.lastMonthCOGS}</span>
                                )}
                            </div>

                            {/* Last Month Labor */}
                            <div>
                                <label htmlFor="lastMonthLabor" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Last Month's Labor Expense <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        id="lastMonthLabor"
                                        placeholder="Enter labor expense"
                                        className={`w-full h-11 rounded-lg text-sm pl-6 ${
                                            errors.lastMonthLabor ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        value={formData.lastMonthLabor}
                                        onChange={(e) => handleInputChange('lastMonthLabor', e.target.value)}
                                        status={errors.lastMonthLabor ? 'error' : ''}
                                    />
                                    {formData.lastMonthLabor && (
                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                                            $
                                        </span>
                                    )}
                                </div>
                                {errors.lastMonthLabor && (
                                    <span className="text-red-500 text-xs mt-1">{errors.lastMonthLabor}</span>
                                )}
                            </div>

                            {/* Monthly Rent */}
                            <div>
                                <label htmlFor="monthlyRent" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Your Monthly Rent <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        id="monthlyRent"
                                        placeholder="Enter monthly rent"
                                        className={`w-full h-11 rounded-lg text-sm pl-6 ${
                                            errors.monthlyRent ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        value={formData.monthlyRent}
                                        onChange={(e) => handleInputChange('monthlyRent', e.target.value)}
                                        status={errors.monthlyRent ? 'error' : ''}
                                    />
                                    {formData.monthlyRent && (
                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                                            $
                                        </span>
                                    )}
                                </div>
                                {errors.monthlyRent && (
                                    <span className="text-red-500 text-xs mt-1">{errors.monthlyRent}</span>
                                )}
                            </div>
                        </div>

                        {/* Calculate Button */}
                        <div className="mt-6">
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="w-full rounded-lg p-3 bg-orange-500 text-white font-semibold text-base hover:bg-orange-600 transition-colors duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Calculating...
                                    </div>
                                ) : (
                                    "Calculate My Score"
                                )}
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfitabilityForm;

