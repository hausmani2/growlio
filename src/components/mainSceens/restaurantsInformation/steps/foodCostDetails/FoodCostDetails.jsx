import SubTrack from '../../../../../assets/svgs/Subtract.svg';
import { Select, Tooltip } from 'antd';

const FoodCostDetails = ({ data, updateData }) => {
    const handleCogsChange = (value) => {
        updateData('cogs_goal', value);
    };

    // Generate percentage options from 20% to 50%
    const generatePercentageOptions = () => {
        const options = [];
        for (let i = 20; i <= 40; i++) {
            let zoneColor = '';
            
            if (i <= 30) {
                zoneColor = '#52c41a'; // Green zone
            } else if (i <= 35) {
                zoneColor = '#faad14'; // Yellow zone
            } else {
                zoneColor = '#ff4d4f'; // Red zone
            }
            
            options.push({
                value: `${i}%`,
                label: (
                    <span style={{ color: zoneColor }}>
                        {i}%
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
                    <label htmlFor="cogs" className="text-base !font-bold text-neutral-600 flex items-center gap-2">What is your COGS goal as a percentage of sales?<Tooltip placement="bottomLeft" title="Select the percentage of sales that you want to achieve as your COGS goal"><img src={SubTrack} alt="SubTrack" /></Tooltip></label>
                    <Select
                        id="cogs"
                        placeholder="Select Percentage"
                        value={data.cogs_goal || undefined}
                        onChange={handleCogsChange}
                        options={generatePercentageOptions()}
                        style={{
                            height: '40px',
                            fontSize: '16px'
                        }}
                        className="w-full"
                    />
                    <span className='text-base font-regular text-neutral-600'>Green Zone Goal: 31% | Yellow Zone (Needs Attention): 33% | Red Zone (Danger): 36%</span>
                </div>

            </div>
        </div>
    </div>
        )
}

export default FoodCostDetails;