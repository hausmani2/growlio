import { Select } from 'antd';

const LaborInformation = ({ data, updateData }) => {
    // Create percentage options from 1 to 50
    const percentageOptions = Array.from({ length: 50 }, (_, index) => {
        const percentage = index + 1;
        return {
            value: percentage.toString(),
            label: `${percentage}%`
        };
    });

    return (
        <div className="flex mt-5">
        <div className="w-[40%]">
            <div className="flex flex-col gap-2">
                <h4 className="text-[26px] !font-bold !mb-0">Labor Information </h4>
                <span className="text-[22px] text-neutral-600">Add basic labor details so we can help you manage operations more effectively.</span>
            </div>
        </div>
        <div className="w-[60%]">
            <div className="flex flex-col gap-6 p-6 bg-white rounded-xl" >
                <div className='flex flex-col '>
                    <h4 className='text-[24px] text-neutral !font-bold !mb-0'>
                    Labor Goals
                    </h4>
                    <span className='text-[24px] text-neutral font-regular mb-0'>
                    What is your labor goal as a percentage of sales?
                    </span>

                </div>
                <div className="flex flex-col gap-2">
                    <label htmlFor="goal" className="text-[20px] !font-bold text-neutral-600">Goal ✅</label>
                    <Select 
                        type="text" 
                        id="goal" 
                        placeholder="Select percentage" 
                        className="w-full p-2 border border-gray-300 !h-[60px] rounded-md text-[18px] font-normal text-neutral-700"
                        value={data.goal}
                        onChange={(value) => updateData('goal', value)}
                        options={percentageOptions}
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label htmlFor="needsAttention" className="text-[20px] !font-bold text-neutral-600">Needs Attention ⚠️</label>
                    <Select 
                        type="text" 
                        id="needsAttention" 
                        placeholder="Select percentage" 
                        className="w-full p-2 border border-gray-300 !h-[60px] rounded-md text-[18px] font-normal text-neutral-700"
                        value={data.needsAttention}
                        onChange={(value) => updateData('needsAttention', value)}
                        options={percentageOptions}
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label htmlFor="danger" className="text-[20px] !font-bold text-neutral-600">Danger 🔴</label>
                    <Select 
                        type="text" 
                        id="danger" 
                        placeholder="Select percentage" 
                        className="w-full p-2 border border-gray-300 !h-[60px] rounded-md text-[18px] font-normal text-neutral-700"
                        value={data.danger}
                        onChange={(value) => updateData('danger', value)}
                        options={percentageOptions}
                    />
                </div>

            </div>
        </div>
    </div>
        )
}

export default LaborInformation;