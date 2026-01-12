import React from 'react';
import { Input, Select } from 'antd';
import ToggleSwitch from '../../../../buttons/ToggleSwitch';
import { useTabHook } from '../../useTabHook';
import LeftArrow from '../../../../../assets/svgs/left-arrow.svg';
import PrimaryButton from '../../../../buttons/Buttons';
import { useLocation, useNavigate } from 'react-router-dom';

const POSInformation = ({ data, updateData, errors = {}, onSaveAndContinue, loading = false }) => {
    const { navigateToNextStep, navigateToPreviousStep, activeTab, tabs } = useTabHook();
    const location = useLocation();
    const navigate = useNavigate();

    // Check if this is update mode (accessed from sidebar) or onboarding mode
    const isUpdateMode = !location.pathname.includes('/onboarding');

    // POS system options
    const posSystemOptions = [
        { value: 'Square', label: 'Square' },
        { value: 'Lightspeed', label: 'Lightspeed' },
        { value: 'Toast', label: 'Toast' },
        { value: 'Clover', label: 'Clover' },
        { value: 'Revel', label: 'Revel' },
        { value: 'TouchBistro', label: 'TouchBistro' },
        { value: 'Micros', label: 'Micros' },
        { value: 'Other', label: 'Other' }
    ];
    
    const handleGoBack = () => {
        navigateToPreviousStep();
    };

    const handleSaveAndContinueClick = async () => {
        if (onSaveAndContinue) {
            const result = await onSaveAndContinue();
            if (result?.success) {
                // Navigate to next step after successful save
                navigateToNextStep(true); // Skip completion check since we just saved successfully
            }
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mt-6">
            {/* Header Section */}
            <div className="mb-6">
                <h3 className="text-xl font-bold text-orange-600 mb-2">POS Information</h3>
            </div>
            
            {/* Form Fields */}
            <div className="space-y-4">
                <div>
                    <label htmlFor="posSystem" className="block text-sm font-semibold text-gray-700 mb-2">
                        What Point-of-Sale system do you currently use?
                    </label>
                    <Select
                        id="posSystem"
                        placeholder="Select a POS system"
                        className={`w-full h-11 rounded-lg text-sm ${
                            errors.posSystem ? 'border-red-500' : ''
                        }`}
                        value={data?.posSystem && data.posSystem !== '' ? data.posSystem : undefined}
                        onChange={(value) => {
                            updateData('posSystem', value);
                            // Clear other input if switching away from "Other"
                            if (value !== 'Other') {
                                updateData('posSystemOther', '');
                            }
                        }}
                        options={posSystemOptions}
                        status={errors.posSystem ? 'error' : ''}
                    />
                    {errors.posSystem && (
                        <span className="text-red-500 text-xs mt-1">{errors.posSystem}</span>
                    )}
                </div>

                {/* Show input field when "Other" is selected */}
                {data?.posSystem === 'Other' && (
                    <div>
                        <label htmlFor="posSystemOther" className="block text-sm font-semibold text-gray-700 mb-2">
                            Please specify the POS system name
                        </label>
                        <Input
                            id="posSystemOther"
                            placeholder="Enter POS system name"
                            className={`w-full h-11 rounded-lg text-sm ${
                                errors.posSystemOther ? 'border-red-500' : ''
                            }`}
                            value={data?.posSystemOther || ''}
                            onChange={(e) => updateData('posSystemOther', e.target.value)}
                            status={errors.posSystemOther ? 'error' : ''}
                        />
                        {errors.posSystemOther && (
                            <span className="text-red-500 text-xs mt-1">{errors.posSystemOther}</span>
                        )}
                    </div>
                )}

                {/* Yes/No Questions Section */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="space-y-3">
                        {/* Question 1: Separate online ordering platform */}
                        <div
                            onClick={() => {
                                const currentValue = data?.separateOnlineOrdering ?? false;
                                updateData('separateOnlineOrdering', !currentValue);
                            }}
                            className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 gap-3 sm:gap-0 cursor-pointer hover:bg-gray-100 hover:border-gray-300 transition-all duration-200"
                        >
                            <div className='flex flex-col gap-1 flex-1'>
                                <span className="text-sm font-semibold text-gray-700">
                                    Do you use a separate online ordering platform from your POS system?
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`text-sm font-medium ${data?.separateOnlineOrdering ? 'text-gray-400' : 'text-gray-700'}`}>
                                    No
                                </span>
                                <ToggleSwitch
                                    isOn={data?.separateOnlineOrdering ?? false}
                                    setIsOn={() => {
                                        const currentValue = data?.separateOnlineOrdering ?? false;
                                        updateData('separateOnlineOrdering', !currentValue);
                                    }}
                                    size="large"
                                />
                                <span className={`text-sm font-medium ${data?.separateOnlineOrdering ? 'text-gray-700' : 'text-gray-400'}`}>
                                    Yes
                                </span>
                            </div>
                        </div>

                        {/* Question 2: POS for tracking employee hours */}
                        <div
                            onClick={() => {
                                const currentValue = data?.posForEmployeeHours ?? false;
                                updateData('posForEmployeeHours', !currentValue);
                            }}
                            className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 gap-3 sm:gap-0 cursor-pointer hover:bg-gray-100 hover:border-gray-300 transition-all duration-200"
                        >
                            <div className='flex flex-col gap-1 flex-1'>
                                <span className="text-sm font-semibold text-gray-700">
                                    Is your POS also used for tracking employee hours for payroll?
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`text-sm font-medium ${data?.posForEmployeeHours ? 'text-gray-400' : 'text-gray-700'}`}>
                                    No
                                </span>
                                <ToggleSwitch
                                    isOn={data?.posForEmployeeHours ?? false}
                                    setIsOn={() => {
                                        const currentValue = data?.posForEmployeeHours ?? false;
                                        updateData('posForEmployeeHours', !currentValue);
                                    }}
                                    size="large"
                                />
                                <span className={`text-sm font-medium ${data?.posForEmployeeHours ? 'text-gray-700' : 'text-gray-400'}`}>
                                    Yes
                                </span>
                            </div>
                        </div>

                        {/* Question 3: Third-party delivery orders go directly to POS */}
                        <div
                            onClick={() => {
                                const currentValue = data?.thirdPartyOrdersToPos ?? false;
                                updateData('thirdPartyOrdersToPos', !currentValue);
                            }}
                            className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 gap-3 sm:gap-0 cursor-pointer hover:bg-gray-100 hover:border-gray-300 transition-all duration-200"
                        >
                            <div className='flex flex-col gap-1 flex-1'>
                                <span className="text-sm font-semibold text-gray-700">
                                    Do your third-party delivery orders (like Uber Eats or DoorDash) go directly into your POS?
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`text-sm font-medium ${data?.thirdPartyOrdersToPos ? 'text-gray-400' : 'text-gray-700'}`}>
                                    No
                                </span>
                                <ToggleSwitch
                                    isOn={data?.thirdPartyOrdersToPos ?? false}
                                    setIsOn={() => {
                                        const currentValue = data?.thirdPartyOrdersToPos ?? false;
                                        updateData('thirdPartyOrdersToPos', !currentValue);
                                    }}
                                    size="large"
                                />
                                <span className={`text-sm font-medium ${data?.thirdPartyOrdersToPos ? 'text-gray-700' : 'text-gray-400'}`}>
                                    Yes
                                </span>
                            </div>
                        </div>
                        {!isUpdateMode && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-6">
                     <PrimaryButton 
                        icon={LeftArrow} 
                        title="Go Back" 
                        className="bg-gray-200 text-black h-11 w-full sm:w-auto text-sm" 
                        onClick={handleGoBack} 
                        disabled={loading} 
                    />
                    <div className="flex gap-3">
                        <PrimaryButton 
                            title="Skip" 
                            className="bg-gray-200 text-gray-700 h-11 w-full sm:w-auto text-sm" 
                            onClick={() => {
                            
                                navigate('/dashboard/sales-data');
                            }} 
                            disabled={loading} 
                        />
                        <PrimaryButton 
                            title={loading ? "Saving..." : "Save & Continue"} 
                            className="btn-brand w-full sm:w-auto"
                            onClick={handleSaveAndContinueClick}
                            disabled={loading}
                        />
                    </div>
                </div>
            )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default POSInformation;

