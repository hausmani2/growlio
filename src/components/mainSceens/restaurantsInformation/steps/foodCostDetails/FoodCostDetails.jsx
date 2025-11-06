import SubTrack from '../../../../../assets/svgs/Subtract.svg';
import { Select, Tooltip } from 'antd';
import useTooltips from '../../../../../utils/useTooltips';
import TooltipIcon from '../../../../common/TooltipIcon';

const FoodCostDetails = ({ data, updateData, errors = {} }) => {
    const handleCogsChange = (value) => {
        updateData('cogs_goal', value);
    };

    // Generate percentage options from 15% to 50% with zone colors
    const generatePercentageOptions = () => {
        const options = [];
        for (let i = 1; i <= 34; i++) {
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

    const tooltips = useTooltips('onboarding-food');

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            {/* Header Section */}
            <div className="mb-6" data-guidance="food_cost_title">
                <h3 className="text-xl font-bold text-orange-600 mb-1">Food Cost Details</h3>
                <p className="text-gray-600 text-sm">
                Add your average food cost and pricing structure so we can help manage your food costs more effectively
                </p>
            </div>
            
            {/* Form Fields */}
            <div className="space-y-4">
                {/* COGS Goals Section */}
                <div data-guidance="cogs_goals_section">
                    <h4 className="text-lg font-semibold text-gray-800 ">
                        Cost of Goods (COGS) Goals
                    </h4>
                    
                    <div className="space-y-3">
                        <label htmlFor="cogs" className="block text-sm font-semibold text-gray-700 flex items-center gap-2" data-guidance="cogs_goal_field">
                            What is your COGS goal as a percentage of sales?
                            <span className="text-red-500">*</span>
                            <TooltipIcon text={tooltips['cogs_goal']} />
                        </label>
                        
                        <Select
                            id="cogs"
                            placeholder="Select Percentage"
                            value={data?.cogs_goal || undefined}
                            onChange={handleCogsChange}
                            options={generatePercentageOptions()}
                            className={`w-full h-11 rounded-lg text-sm ${
                                errors.cogs_goal ? 'border-red-500' : ''
                            }`}
                            status={errors.cogs_goal ? 'error' : ''}
                        />
                        
                        {errors.cogs_goal && (
                            <span className="text-red-500 text-xs mt-1">{errors.cogs_goal}</span>
                        )}
                        
                    </div>
                </div>
            </div>
        </div>
    )
}

export default FoodCostDetails;