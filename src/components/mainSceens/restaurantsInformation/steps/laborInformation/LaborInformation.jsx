import { Select } from 'antd';

const LaborInformation = ({ data, updateData, errors = {} }) => {

    
    const handleLaborGoalChange = (value) => {
        // Convert the value to just the number if it contains percentage symbol
        const numericValue = value.toString().replace('%', '');
        updateData('labour_goal', numericValue);
    };

    // Generate percentage options from 15% to 40% with color coding
    const generateLaborPercentageOptions = () => {
        const options = [];
        for (let i = 1; i <= 40; i++) {
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

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            {/* Header Section */}
            <div className="mb-6">
                <h3 className="text-xl font-bold text-orange-600 mb-2">Labor Information</h3>
                <p className="text-gray-600 text-sm">
                    Add basic labor details so we can help you manage operations more effectively.
                </p>
            </div>
            
            {/* Form Fields */}
            <div className="space-y-4">
                {/* Labor Goals Section */}
                <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">
                        Labor Goals
                    </h4>
                    <p className="text-gray-600 text-sm mb-4">
                        What are your Labor Goals as a Percentage of Sales?
                    </p>
                    
                    <div className="space-y-3">
                        <label htmlFor="labour_goal" className="block text-sm font-semibold text-gray-700">
                            Labor Goal as Percentage of Sales <span className="text-red-500">*</span>
                        </label>
                        <Select
                            id="labour_goal"
                            placeholder="Select Percentage"
                            value={data.labour_goal ? Math.round(parseFloat(data.labour_goal)).toString() : undefined}
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
                        <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
                            <span className="font-medium">Zone Guidelines:</span><br/>
                            <span className="text-green-600">🟢 Green Zone (Goal): 25%</span> | 
                            <span className="text-yellow-600">🟡 Yellow Zone (Needs Attention): 27%</span> | 
                            <span className="text-red-600">🔴 Red Zone (Danger): 30%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LaborInformation;