import { Select } from 'antd';
import { useEffect } from 'react';
import useTooltips from '../../../../../utils/useTooltips';
import TooltipIcon from '../../../../common/TooltipIcon';

const LaborInformation = ({ data, updateData, errors = {} }) => {
    // Set default value on component mount
    useEffect(() => {
        if (!data.labour_goal) {
            updateData('labour_goal', '28');
        }
    }, []);

    const handleLaborGoalChange = (value) => {
        // Convert the value to just the number if it contains percentage symbol
        const numericValue = value.toString().replace('%', '');
        updateData('labour_goal', numericValue);
    };

    // Generate percentage options from 15% to 40% with color coding
    const generateLaborPercentageOptions = () => {
        const options = [];
        for (let i = 1; i <= 30; i++) {
            let zoneColor = '';
            let zoneLabel = '';
            
            if (i <= 30) {
                zoneColor = '#52c41a'; // Green zone (Goal)
                zoneLabel = '✅ Goal';
            } else if (i <= 33) {
                zoneColor = '#faad14'; // Yellow zone (Needs Attention)
                zoneLabel = '⚠️ Needs Attention';
            } else {
                zoneColor = '#ff4d4f'; // Red zone (Danger)
                zoneLabel = '🔴 Danger';
            }
            
            options.push({
                value: i.toString(), // Use just the number as value
                label: (
                    <span style={{ color: zoneColor }}>
                        {i}% - {zoneLabel}
                    </span>
                )
            });
        }
        return options;
    };

    const tooltips = useTooltips('onboarding-labor');

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            {/* Header Section */}
            <div className="mb-6">
                <h3 className="text-xl font-bold text-orange-600 mb-2">Labor Information</h3>
            </div>
            
            {/* Form Fields */}
            <div className="space-y-4">
                {/* Labor Goals Section */}
                <div>
                    <h4 className="text-lg font-semibold text-gray-800 ">
                        Labor Goals
                    </h4>
                    <p className="text-gray-600 text-sm mb-4">
                        What are your Labor Goals as a Percentage of Sales?
                    </p>
                    
                    <div className="space-y-3">
                        <label htmlFor="labour_goal" className="block text-sm font-semibold text-gray-700">
                            Labor Goal as Percentage of Sales <span className="text-red-500">*</span>
                            <TooltipIcon text={tooltips['labour_goal']} />
                        </label>
                        <Select
                            id="labour_goal"
                            placeholder="Select Percentage"
                            value={data.labour_goal || "28"}
                            onChange={handleLaborGoalChange}
                            options={generateLaborPercentageOptions()}
                            className={`w-full h-11 rounded-lg text-sm ${
                                errors.labour_goal ? 'border-red-500' : ''
                            }`}
                            status={errors.labour_goal ? 'error' : ''}
                        />
                        {errors.labour_goal && (
                            <span className="text-red-500 text-xs mt-1">{errors.labour_goal}</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LaborInformation;