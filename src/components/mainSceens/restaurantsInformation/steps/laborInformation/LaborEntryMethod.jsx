import { useState, useEffect } from 'react';
import { Input, Select, Tooltip } from 'antd';
import useTooltips from '../../../../../utils/useTooltips';
import TooltipIcon from '../../../../common/TooltipIcon';
import PrimaryButton from '../../../../buttons/Buttons';
import ToggleSwitch from '../../../../buttons/ToggleSwitch';
import { TiArrowLeft } from 'react-icons/ti';
import { useTabHook } from '../../useTabHook';
import { useLocation } from 'react-router-dom';
import LeftArrow from '../../../../../assets/svgs/left-arrow.svg';
import SubTrack from '../../../../../assets/svgs/Subtract.svg';

const LaborEntryMethod = ({ data, updateData, onSaveAndContinue, loading = false, errors = {} }) => {
    const location = useLocation();
    const { navigateToNextStep, navigateToPreviousStep } = useTabHook();
    
    // Check if this is update mode (accessed from sidebar) or onboarding mode
    const isUpdateMode = !location.pathname.includes('/onboarding');
    
    // Local state for form data
    const [formData, setFormData] = useState({
        goal: '',
        entryMethod: data.labor_record_method || 'daily-hours-costs', // default value
        isDailyHoursCostsEnabled: data.labor_record_method === 'daily-hours-costs'
    });

    // Update local state when props change
    useEffect(() => {
        if (data) {
            setFormData(prev => ({
                ...prev,
                entryMethod: data.labor_record_method || 'daily-hours-costs',
                isDailyHoursCostsEnabled: data.labor_record_method === 'daily-hours-costs'
            }));
        }
    }, [data]);

    const handleGoBack = () => {
        navigateToPreviousStep();
    };

    const handleSaveAndContinueClick = async () => {
        if (onSaveAndContinue) {
            try {
                const result = await onSaveAndContinue();
                if (result?.success) {
                    // Navigate to next step after successful save
                    navigateToNextStep();
                }
            } catch (error) {
                console.error('Error in handleSaveAndContinueClick:', error);
            }
        }
    };


    const handleEntryMethodSelect = (method) => {
        updateData('labor_record_method', method);
        setFormData(prev => ({
            ...prev,
            entryMethod: method,
            isDailyHoursCostsEnabled: method === 'daily-hours-costs'
        }));
    };

    const handleToggleSwitch = (isOn) => {
        if (isOn) {
            // When toggle is turned ON, switch to daily-hours-costs
            setFormData(prev => ({
                ...prev,
                isDailyHoursCostsEnabled: true,
                entryMethod: 'daily-hours-costs'
            }));
        } else {
            // When toggle is turned OFF, keep current method but disable daily-hours-costs
            setFormData(prev => ({
                ...prev,
                isDailyHoursCostsEnabled: false
            }));
        }
    };

    // Function to get toggle text based on entry method
    const getToggleText = () => {
        switch (data.labor_record_method) {
            case 'daily-hours-costs':
                return 'Daily Hours & Costs (Recommended)';
            case 'hours-only':
                return 'Hours Only';
            case 'cost-only':
                return 'Cost Only';
            default:
                return 'Daily Hours & Costs (Recommended)';
        }
    };

    // Function to check if toggle should be enabled
    const isToggleEnabled = () => {
        return data.labor_record_method === 'daily-hours-costs';
    };

    const tooltips = useTooltips('onboarding-labor');

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            {/* Header Section */}
            <div className="mb-6">
                <h3 className="text-xl font-bold text-orange-600 mb-2">Labor Entry Method</h3>
                <p className="text-gray-600 text-sm">
                    Configure how you want to record and manage your labor information.
                </p>
            </div>
            
            {/* Form Fields */}
            <div className="space-y-6">
                {/* Average Hourly Rate */}
                <div>
                    <label htmlFor="hourlyRate" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        What is your average hourly rate for all staff roles? <span className="text-red-500">*</span>
                        <TooltipIcon text={tooltips['avg_hourly_rate']} />
                    </label>
                    <div className="relative">
                        <Input 
                            type="number" 
                            id="avg_hourly_rate" 
                            placeholder="Enter Hourly Wage" 
                            className={`w-full h-11 rounded-lg text-sm pl-6 ${
                                errors.avg_hourly_rate ? 'border-red-500' : 'border-gray-300'
                            }`}
                            value={data.avg_hourly_rate}
                            onChange={(e) => updateData('avg_hourly_rate', e.target.value)}
                            status={errors.avg_hourly_rate ? 'error' : ''}
                        />
                        {data.avg_hourly_rate && (
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                                $
                            </span>
                        )}
                    </div>
                    {errors.avg_hourly_rate && (
                        <span className="text-red-500 text-xs mt-1">{errors.avg_hourly_rate}</span>
                    )}
                </div>
                
                {/* Labor Recording Method */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                        How would you like to record your labor?
                        <TooltipIcon text={tooltips['labor_record_method']} />
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <PrimaryButton 
                            title="Daily Hours & Costs (Recommended)" 
                            className={`h-11 px-4 text-sm font-medium rounded-lg hover:border-orange-300 ${
                                data.labor_record_method === 'daily-hours-costs' 
                                    ? 'border border-orange-500 text-orange-500' 
                                    : 'text-neutral'
                            }`}
                            onClick={() => handleEntryMethodSelect('daily-hours-costs')}
                        />
                        <PrimaryButton 
                            title="Hours Only" 
                            className={`h-11 px-4 text-sm font-medium rounded-lg hover:border-orange-300 ${
                                data.labor_record_method === 'hours-only' 
                                    ? 'border border-orange-500 text-orange-500' 
                                    : 'text-neutral'
                            }`}
                            onClick={() => handleEntryMethodSelect('hours-only')}
                        />
                        <PrimaryButton 
                            title="Cost Only" 
                            className={`h-11 px-4 text-sm font-medium rounded-lg hover:border-orange-300 ${
                                data.labor_record_method === 'cost-only' 
                                    ? 'border border-orange-500 text-orange-500' 
                                    : 'text-neutral'
                            }`}
                            onClick={() => handleEntryMethodSelect('cost-only')}
                        />
                    </div>
                </div>
                
                {/* Toggle Switch */}
                <div 
                    onClick={handleToggleSwitch}
                    className="flex items-center justify-between px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 hover:border-gray-300 transition-all duration-200"
                >
                    <span className="text-sm font-medium text-gray-700">{getToggleText()}</span>
                    <ToggleSwitch
                        isOn={isToggleEnabled()}
                        setIsOn={handleToggleSwitch}
                        disabled={false}
                        size="large"
                    />
                </div>
                
                {/* Daily Ticket Count */}
                <div>
                    <label htmlFor="ticketCount" className="block text-sm font-semibold text-gray-700 mb-2">
                        Would you like to daily ticket count?
                        <TooltipIcon text={tooltips['daily_ticket_count']} />
                    </label>
                    <Select 
                        id="daily_ticket_count" 
                        placeholder="No" 
                        className="w-full h-11 rounded-lg text-sm"
                        value={data.daily_ticket_count}
                        onChange={(value) => updateData('daily_ticket_count', value)}
                    >
                        <Select.Option value="1">No</Select.Option>
                        <Select.Option value="2">Yes</Select.Option>
                    </Select>                
                </div>
                
                {/* Forward Previous Week Rate */}
                <div>
                    <label htmlFor="previousLaborReport" className="block text-sm font-semibold text-gray-700 mb-2">
                        Forward previous week's actual labor rate?
                        <TooltipIcon text={tooltips['forward_prev_week_rate']} />
                    </label>
                    <Select 
                        id="forward_prev_week_rate" 
                        placeholder="No" 
                        className="w-full h-11 rounded-lg text-sm"
                        value={data.forward_prev_week_rate}
                        onChange={(value) => updateData('forward_prev_week_rate', value)}
                    >
                        <Select.Option value="1">No</Select.Option>
                        <Select.Option value="2">Yes</Select.Option>
                    </Select>                
                </div>
            </div>
            
            {/* Navigation Buttons */}
            {!isUpdateMode && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-6">
                    <PrimaryButton 
                        title="Back" 
                        className="border-none w-full sm:w-auto"
                        onClick={handleGoBack}
                        disabled={loading}
                    />
                    <PrimaryButton 
                        title={loading ? "Saving..." : "Save & Continue"} 
                        className="btn-brand w-full sm:w-auto"
                        onClick={handleSaveAndContinueClick}
                        disabled={loading}
                    />
                </div>
            )}
        </div>
    );
}

export default LaborEntryMethod;