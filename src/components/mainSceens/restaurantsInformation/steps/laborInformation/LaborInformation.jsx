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
            
            if (i <= 25) {
                zoneColor = '#52c41a'; // Green zone (Goal)
                zoneLabel = '✅ Goal';
            } else if (i <= 27) {
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
        <div className="flex mt-5">
        <div className="w-[40%]">
            <div className="flex flex-col gap-2">
                <h4 className="text-lg !font-bold !mb-0">Labor Information </h4>
                <span className="text-base text-neutral-600">Add basic labor details so we can help you manage operations more effectively.</span>
            </div>
        </div>
        <div className="w-[60%]">
            <div className="flex flex-col gap-3 p-6 bg-white rounded-xl" >
                <div className='flex flex-col '>
                    <h4 className='text-lg text-neutral !font-bold !mb-0'>
                    Labor Goals
                    </h4>
                    <span className='text-base text-neutral font-regular mb-0'>
                    What are your Labor Goals as a Percentage of Sales?
                    </span>

                </div>
                <div className="flex flex-col gap-2">
                    <label htmlFor="labour_goal" className="text-base !font-bold text-neutral-600">
                        Labor Goal as Percentage of Sales <span className="text-red-500">*</span>
                    </label>
                    <Select
                        id="labour_goal"
                        placeholder="Select Percentage"
                        value={data.labour_goal || undefined}
                        onChange={handleLaborGoalChange}
                        options={generateLaborPercentageOptions()}
                        style={{
                            height: '40px',
                            fontSize: '16px'
                        }}
                        className={`w-full ${errors.labour_goal ? 'border-red-500' : ''}`}
                        status={errors.labour_goal ? 'error' : ''}
                    />
                    {errors.labour_goal && (
                        <span className="text-red-500 text-sm">{errors.labour_goal}</span>
                    )}
                    <span className='text-base font-regular text-neutral-600'>Green Zone (Goal): 25% | Yellow Zone (Needs Attention): 27% | Red Zone (Danger): 30%</span>
                </div>

            </div>
        </div>
    </div>
        )
}

export default LaborInformation;