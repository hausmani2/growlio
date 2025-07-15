import { useState, useEffect } from 'react';
import { Select } from 'antd';
import PrimaryButton from '../../../../buttons/Buttons';
import ToggleSwitch from '../../../../buttons/ToggleSwitch';
import { TiArrowLeft } from 'react-icons/ti';
import { useTabHook } from '../../useTabHook';
import LeftArrow from '../../../../../assets/svgs/left-arrow.svg';

const LaborEntryMethod = ({ data, updateData }) => {
    const { handleTabClick } = useTabHook();
    
    // Local state for form data
    const [formData, setFormData] = useState({
        goal: '',
        entryMethod: 'daily-hours-costs', // default value
        isDailyHoursCostsEnabled: true
    });

    // Update local state when props change
    useEffect(() => {
        if (data) {
            setFormData(prev => ({
                ...prev,
                ...data
            }));
        }
    }, [data]);

    const handleGoBack = () => {
        handleTabClick(0); // Navigate to Food Cost Details (tab index 1)
    };

    const handleSaveAndContinue = () => {
        // Validate form data
        if (!formData.goal || formData.goal.trim() === '') {
            alert('Please enter a labor goal percentage');
            return;
        }

        // Validate percentage format
        const goalValue = parseFloat(formData.goal);
        if (isNaN(goalValue) || goalValue < 0 || goalValue > 100) {
            alert('Please enter a valid percentage between 0 and 100');
            return;
        }

        // Update parent component data
        if (updateData) {
            updateData('laborEntryMethod', {
                goal: formData.goal,
                entryMethod: formData.entryMethod,
                isDailyHoursCostsEnabled: formData.isDailyHoursCostsEnabled
            });
        }

        // Navigate to next tab (Sales Channel - tab index 3)
        handleTabClick(3);
    };

    const handleInputChange = (field, value) => {
        // For goal field, only allow numbers and decimal point
        if (field === 'goal') {
            const numericValue = value.replace(/[^0-9.]/g, '');
            // Ensure only one decimal point
            const parts = numericValue.split('.');
            if (parts.length > 2) return;
            // Limit to 2 decimal places
            if (parts[1] && parts[1].length > 2) return;
            // Limit to 100
            if (parseFloat(numericValue) > 100) return;
            
            setFormData(prev => ({
                ...prev,
                [field]: numericValue
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [field]: value
            }));
        }
    };

    const handleEntryMethodSelect = (method) => {
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
        switch (formData.entryMethod) {
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
        return formData.isDailyHoursCostsEnabled;
    };

    return (
        <div className="flex mt-5">
        <div className="w-[40%]">
            <div className="flex flex-col gap-2">
                <h4 className="text-lg !font-bold !mb-0">Labor Information </h4>
                <span className="text-base text-neutral-600">Add basic labor details so we can help you manage operations more effectively.</span>
            </div>
        </div>
        <div className="w-[60%]">
            <div className="flex flex-col gap-3 p-6 bg-white rounded-xl" >

                <div className="flex flex-col gap-2">
                    <label htmlFor="hourlyRate" className="text-base !font-bold text-neutral-600">What is your average hourly rate for all staff roles?</label>
                   <div className="relative">
                        <input 
                            type="number" 
                            id="hourlyRate" 
                            placeholder="Write Hourly Wage" 
                            className="w-full p-2 pr-8 border border-gray-300 !h-[40px] rounded-md text-base font-normal text-neutral-700 pl-6" 
                            value={formData.hourlyRate}
                            onChange={(e) => handleInputChange('hourlyRate', e.target.value)}
                        />
                        {formData.hourlyRate && (
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-base">
                                $
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex flex-col gap-4">
                    <div className='flex flex-col gap-2'>
                    <label htmlFor="needsAttention" className="text-base !font-bold text-neutral-600">How would you like to record your labor?</label>
                    <div className='flex items-center gap-2 justify-between w-full'>
                        <PrimaryButton 
                            title="Daily Hours & Costs (Recommended)" 
                            className={`h-[40px] px-3 py-4 text-base font-medium rounded-md hover:border-orange-300 ${
                                formData.entryMethod === 'daily-hours-costs' 
                                    ? 'border border-orange-500 text-orange-500' 
                                    : 'text-neutral'
                            }`}
                            onClick={() => handleEntryMethodSelect('daily-hours-costs')}
                        />
                        <PrimaryButton 
                            title="Hours Only" 
                            className={`h-[40px] px-3 py-4 text-base font-medium rounded-md hover:border-orange-300 ${
                                formData.entryMethod === 'hours-only' 
                                    ? 'border border-orange-500 text-orange-500' 
                                    : 'text-neutral '
                            }`}
                            onClick={() => handleEntryMethodSelect('hours-only')}
                        />
                        <PrimaryButton 
                            title="Cost Only" 
                            className={`h-[40px] px-3 py-4 text-base font-medium rounded-md hover:border-orange-300 ${
                                formData.entryMethod === 'cost-only' 
                                    ? 'border border-orange-500 text-orange-500' 
                                    : 'text-neutral '
                            }`}
                            onClick={() => handleEntryMethodSelect('cost-only')}
                        />

                    </div>
                    </div>
                    <div
                                className={`flex items-center justify-between px-6 py-4 border border-gray-200 rounded-xl bg-white`}
                            >
                                <span className={`text-base`}>{getToggleText()}</span>
                                <ToggleSwitch
                                    isOn={isToggleEnabled()}
                                    setIsOn={handleToggleSwitch}
                                    disabled={false}
                                />
                            </div>

                </div>
                <div className="flex flex-col gap-2">
                        <label htmlFor="ticketCount" className="text-base !font-bold text-neutral-600 flex items-center gap-2">Would you like to daily ticket count?</label>
                        <Select 
                            type="text" 
                            id="ticketCount" 
                            placeholder="No" 
                            className="w-full p-2 !h-[40px] rounded-md text-base font-normal text-neutral-700"
                            value={data.ticketCount}
                            onChange={(value) => updateData('ticketCount', value)}
                        >
                            <Select.Option value="1">No</Select.Option>
                            <Select.Option value="2">Yes</Select.Option>
                        </Select>                
                    </div>
                <div className="flex flex-col gap-2">
                        <label htmlFor="previousLaborReport" className="text-base !font-bold text-neutral-600 flex items-center gap-2">Forword previous week's actual labor rate?</label>
                        <Select 
                            type="text" 
                            id="previousLaborReport" 
                            placeholder="No" 
                            className="w-full p-2 !h-[40px] rounded-md text-base font-normal text-neutral-700"
                            value={data.previousLaborReport}
                            onChange={(value) => updateData('ticketCount', value)}
                        >
                            <Select.Option value="1">No</Select.Option>
                            <Select.Option value="2">Yes</Select.Option>
                        </Select>                
                    </div>
                

            </div>
            <div className="flex justify-between items-center my-5">
                        <PrimaryButton icon={LeftArrow} title="Go Back" className="bg-gray-200 text-black h-[40px]" onClick={handleGoBack} />
                        <PrimaryButton 
                            title="Save & Continue" 
                            className="btn-brand"
                            onClick={handleSaveAndContinue}
                        />
                </div>
        </div>
    </div>
        )
}

export default LaborEntryMethod;