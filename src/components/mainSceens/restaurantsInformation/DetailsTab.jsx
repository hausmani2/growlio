import { useTabHook } from './useTabHook';

const DetailsTab = () => {
    const { activeTab, tabs, handleTabClick } = useTabHook();

    return (
        <div className='flex flex-col gap-4'>
            <div className="flex flex-col gap-2">
                <h2 className='text-2xl font-bold !mb-0'>Let's Get Your Restaurant Online</h2>
                <span className="text-base text-neutral-600 font-medium">Fill out the info, add your hours, and start serving customers on Growlio.</span>
            </div>

            <div className="bg-orange-300 flex items-center rounded-xl py-4 px-4 w-full max-w-full max-xl:flex-col">
                <div className="flex items-center gap-2 w-full justify-center max-xl:flex-col">
                    {tabs.map((tab) => (
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
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DetailsTab;