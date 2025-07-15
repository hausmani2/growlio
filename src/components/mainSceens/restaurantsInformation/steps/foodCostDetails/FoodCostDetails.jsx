import SubTrack from '../../../../../assets/svgs/Subtract.svg';
import { Select } from 'antd';

const FoodCostDetails = ({ data, updateData }) => {
    const handleCogsChange = (value) => {
        updateData('cogsGoal', value);
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
                <h4 className="text-[26px] !font-bold !mb-0">Food Cost Details </h4>
                <span className="text-[22px] text-neutral-600">Share your average food cost and pricing structure to help us better support your business planning.</span>
            </div>
        </div>
        <div className="w-[60%]">
            <div className="flex flex-col gap-6 p-6 bg-white rounded-xl" >
                <div>
                    <span className="text-[24px] font-bold ">
                    Cost of Goods (COGS) Goals
                    </span>
                </div>
                <div className="flex flex-col gap-2">
                    <label htmlFor="cogs" className="text-[20px] !font-bold text-neutral-600 flex items-center gap-2">What is your COGS goal as a percentage of sales? <img src={SubTrack} alt="SubTrack" /></label>
                    <Select
                        id="cogs"
                        placeholder="Select Percentage"
                        value={data.cogsGoal || undefined}
                        onChange={handleCogsChange}
                        options={generatePercentageOptions()}
                        style={{
                            height: '60px',
                            fontSize: '18px'
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