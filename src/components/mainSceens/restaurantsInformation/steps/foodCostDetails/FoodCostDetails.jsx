import SubTrack from '../../../../../assets/svgs/Subtract.svg';
import { Select, Tooltip } from 'antd';

const FoodCostDetails = ({ data, updateData, errors = {} }) => {
    const handleCogsChange = (value) => {
        updateData('cogs_goal', value);
    };

    // Generate percentage options from 15% to 50% with zone colors
    const generatePercentageOptions = () => {
        const options = [];
        for (let i = 15; i <= 50; i++) {
            let zoneColor = '';
            let zoneLabel = '';
            
            if (i <= 31) {
                zoneColor = '#52c41a'; // Green zone
                zoneLabel = ' (Goal)';
            } else if (i <= 33) {
                zoneColor = '#faad14'; // Yellow zone
                zoneLabel = ' (Needs Attention)';
            } else {
                zoneColor = '#ff4d4f'; // Red zone
                zoneLabel = ' (Danger)';
            }
            
            options.push({
                value: `${i}%`,
                label: (
                    <span style={{ color: zoneColor }}>
                        {i}%{zoneLabel}
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
                <h4 className="text-lg !font-bold !mb-0">Food Cost Details </h4>
                <span className="text-base text-neutral-600">Share your average food cost and pricing structure to help us better support your business planning.</span>
            </div>
        </div>
        <div className="w-[60%]">
            <div className="flex flex-col gap-3 p-6 bg-white rounded-xl" >
                <div>
                    <span className="text-lg font-bold ">
                    Cost of Goods (COGS) Goals
                    </span>
                </div>
                <div className="flex flex-col gap-2">
                    <label htmlFor="cogs" className="text-base !font-bold text-neutral-600 flex items-center gap-2">
                        What is your COGS goal as a percentage of sales?
                        <span className="text-red-500">*</span>
                        <Tooltip placement="bottomLeft" title="Select the percentage of sales that you want to achieve as your COGS goal">
                            <img src={SubTrack} alt="SubTrack" />
                        </Tooltip>
                    </label>
                    <Select
                        id="cogs"
                        placeholder="Select Percentage"
                        value={data?.cogs_goal || undefined}
                        onChange={handleCogsChange}
                        options={generatePercentageOptions()}
                        style={{
                            height: '40px',
                            fontSize: '16px'
                        }}
                        className={`w-full ${errors.cogs_goal ? 'border-red-500' : 'border-gray-300'}`}
                        status={errors.cogs_goal ? 'error' : ''}
                    />
                    {errors.cogs_goal && (
                        <span className="text-red-500 text-sm">{errors.cogs_goal}</span>
                    )}
                    <div className='text-base font-regular text-neutral-600'>
                        <span className="text-green-600 font-semibold">Green Zone (Goal): 31%</span> | 
                        <span className="text-yellow-600 font-semibold"> Yellow Zone (Needs Attention): 33%</span> | 
                        <span className="text-red-600 font-semibold"> Red Zone (Danger): 36%</span>
                    </div>
                </div>

            </div>
        </div>
    </div>
        )
}

export default FoodCostDetails;