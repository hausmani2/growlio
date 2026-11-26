import SubTrack from '../../../../../assets/svgs/Subtract.svg';
import { Checkbox, Select, Tooltip } from 'antd';
import useTooltips from '../../../../../utils/useTooltips';
import TooltipIcon from '../../../../common/TooltipIcon';
import { useEffect } from 'react';

const FoodCostDetails = ({ data, updateData, errors = {} }) => {
    // Set default value on component mount if not already set
    useEffect(() => {
        if (!data.cogs_goal || data.cogs_goal === '' || data.cogs_goal === '0%') {
            updateData('cogs_goal', '30%');
        }
    }, [data.cogs_goal, updateData]);

    const handleCogsChange = (value) => {
        updateData('cogs_goal', value);
    };

    // Generate percentage options from 15% to 50% with zone colors
    const generatePercentageOptions = () => {
        const options = [];
        for (let i = 1; i <= 36; i++) {
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

    const varianceCoverageOptions = [
        { value: '', label: 'Keep variance hidden' },
        ...Array.from({ length: 101 }, (_, percent) => ({
            value: percent,
            label: `${percent}%`,
        })),
    ];

    const tooltips = useTooltips('onboarding-food');

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            {/* Header Section */}
            <div className="mb-6">
                <h3 className="text-xl font-bold text-orange-600 mb-1">Food Cost Details</h3>
                <p className="text-gray-600 text-sm">
                Add your average food cost and pricing structure so we can help manage your food costs more effectively
                </p>
            </div>
            
            {/* Form Fields */}
            <div className="space-y-4">
                {/* COGS Goals Section */}
                <div>
                    <h4 className="text-lg font-semibold text-gray-800 ">
                        Cost of Goods (COGS) Goals
                    </h4>
                    
                    <div className="space-y-3">
                        <label htmlFor="cogs" className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                        What is your weekly COGS goal as a percentage of sales?
                            <span className="text-red-500">*</span>
                            <TooltipIcon text={tooltips['cogs_goal']} />
                        </label>
                        
                        <Select
                            id="cogs"
                            placeholder="Select Percentage"
                            value={data?.cogs_goal ? data.cogs_goal.toString() : "30%"}
                            onChange={handleCogsChange}
                            options={generatePercentageOptions()}
                            className={`w-full h-11 rounded-lg text-sm ${
                                errors.cogs_goal ? 'border-red-500' : ''
                            }`}
                            status={errors.cogs_goal ? 'error' : ''}
                            showSearch={false}
                        />
                        
                        {errors.cogs_goal && (
                            <span className="text-red-500 text-xs mt-1">{errors.cogs_goal}</span>
                        )}
                        
                    </div>
                </div>

                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-5 space-y-4">
                    <div>
                        <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                            Menu Intelligence
                            <TooltipIcon text="This controls the Food Cost Variance card. It subtracts the recipe food cost from the Close Out food cost. Pick how much of sales must have a complete recipe, then confirm fresh prices and that both numbers measure the same kind of cost. Leave the percent on Keep variance hidden and that card stays on Insufficient data." />
                        </h4>
                        <p className="mt-1 text-sm text-gray-600">
                            These choices control the Food Cost Variance card. The weekly COGS goal above is separate.
                        </p>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
                        <label className="block text-sm font-semibold text-gray-700">
                            Show Food Cost Variance when at least this much of sales has a complete recipe.
                        </label>
                        <Select
                            placeholder="Keep variance hidden"
                            value={
                                data?.variance_coverage_pct === null ||
                                data?.variance_coverage_pct === undefined ||
                                data?.variance_coverage_pct === ''
                                    ? ''
                                    : Number(data.variance_coverage_pct)
                            }
                            onChange={(value) =>
                                updateData('variance_coverage_pct', value === '' ? null : Number(value))
                            }
                            options={varianceCoverageOptions}
                            className="w-full h-11 rounded-lg text-sm"
                            showSearch={false}
                        />
                        <p className="text-xs text-gray-500">
                            Choose a percent from the list. Keep variance hidden leaves the Dashboard card on Insufficient data.
                        </p>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <Checkbox
                            className="items-start text-sm text-gray-700"
                            checked={Boolean(data?.variance_pricing_confirmed)}
                            onChange={(event) =>
                                updateData('variance_pricing_confirmed', event.target.checked)
                            }
                        >
                            Confirmed prices from the last 30 days are reliable enough for this comparison.
                        </Checkbox>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <Checkbox
                            className="items-start text-sm text-gray-700"
                            checked={Boolean(data?.variance_costs_comparable)}
                            onChange={(event) =>
                                updateData('variance_costs_comparable', event.target.checked)
                            }
                        >
                            Close Out COGS and recipe food cost are the same kind of cost.
                        </Checkbox>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default FoodCostDetails;