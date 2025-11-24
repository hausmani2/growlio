import { useTabHook } from './useTabHook';

const DetailsTab = () => {
    const { activeTab, tabs, handleTabClick, getStepStatus } = useTabHook();

    return (
        <div className='flex flex-col gap-4'>
            <div className="flex flex-col gap-2">
                <h2 className='text-2xl font-bold !mb-0 text-neutral-700'>Let's Get Your Restaurant Online</h2>
            </div>

            <div className="bg-orange-300 flex items-center rounded-xl py-4 px-4 w-full max-w-full max-xl:flex-col">
                <div className="flex items-center gap-2 w-full justify-center max-xl:flex-col">
                    {tabs.map((tab) => {
                        const { completed } = getStepStatus(tab.id);
                        
                        // Map step titles to guidance keys
                        const stepGuidanceKeys = {
                            'Basic Information': 'step_1_basic_information',
                            'Sales Channels': 'step_2_sales_channels',
                            'Labor Information': 'step_3_labor_information',
                            'Food Cost Details': 'step_4_food_cost_details',
                            'Expenses': 'step_5_expenses',
                        };
                        
                        const guidanceKey = stepGuidanceKeys[tab.title];
                        
                        return (
                            <div
                                key={tab.id}
                                onClick={() => handleTabClick(tab.id)}
                                className={`h-[40px] bg-white border-l-3 rounded-xl flex items-center justify-center px-3 cursor-pointer transition-all duration-200 hover:shadow-md ${
                                    activeTab === tab.id 
                                        ? 'border-orange-400 shadow-lg' 
                                        : 'border-gray-400'
                                }`}
                            >
                                <div className={`flex items-center justify-center gap-2 text-base px-2 py-2 ${
                                    activeTab === tab.id 
                                        ? 'font-bold text-black' 
                                        : 'font-normal text-neutral-700'
                                }`}>
                                    <span>Step {tab.id + 1}:</span>
                                    <span>{tab.title}</span>
                                    {completed && (
                                        <span className="text-green-600 text-lg font-bold ml-1">
                                            ✓
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default DetailsTab;