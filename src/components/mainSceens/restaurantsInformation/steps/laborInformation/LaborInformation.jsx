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
                    What is your labor goal as a percentage of sales?
                    </span>

                </div>
                <div className="flex flex-col gap-2">
                    <label htmlFor="goal" className="text-base !font-bold text-neutral-600">Goal ✅</label>
                    <Select 
                        type="text" 
                        id="goal" 
                        placeholder="Select percentage" 
                        className="w-full p-2  !h-[40px] rounded-md text-base font-normal text-neutral-700"
                        value={data.goal || undefined}
                        onChange={(value) => updateData('goal', value)}
                        options={percentageOptions}
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label htmlFor="needs_attention" className="text-base !font-bold text-neutral-600">Needs Attention ⚠️</label>
                    <Select 
                        type="text" 
                        id="needs_attention" 
                        placeholder="Select percentage" 
                        className="w-full p-2  !h-[40px] rounded-md text-base font-normal text-neutral-700"
                        value={data.needs_attention || undefined}
                        onChange={(value) => updateData('needs_attention', value)}
                        options={percentageOptions}
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label htmlFor="danger" className="text-base !font-bold text-neutral-600">Danger 🔴</label>
                    <Select 
                        type="text" 
                        id="danger" 
                        placeholder="Select percentage" 
                        className="w-full p-2  !h-[40px] rounded-md text-base font-normal text-neutral-700"
                        value={data.danger || undefined}
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