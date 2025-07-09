const DetailsTab = () => {
    return (
        <div className='flex flex-col gap-10'>
            <div className="flex flex-col gap-4">
                <h2 className='text-4xl font-bold !mb-0'>Let’s Get Your Restaurant Online</h2>
                <span className="text-lg text-neutral-600 font-medium">Fill out the info, add your hours, and start serving customers on Growlio.</span>

            </div>
           

            <div className=" h-[114px] bg-orange-300 flex items-center rounded-xl py-4 px-8 w-[1140px]">
                <div className="flex items-center gap-3">
                    <div className="h-[68px] bg-white border-l-3 border-orange-400 rounded-xl flex items-center justify-center w-[260px]">
                        <div className="flex items-center justify-center gap-2 text-[18px] font-bold">
                            <span>Step 1:</span>
                            <span>Basic Information</span>
                        </div>
                       
                        
                    </div>
                    <div className="h-[68px]  bg-white border-l-3 border-gray-400 rounded-xl flex items-center justify-center w-[260px] ">
                        <div className="flex items-center justify-center gap-1 text-[18px] font-normal text-neutral-700 px-2 py-2">
                            <span>Step 1:</span>
                            <span>Basic Information</span>
                        </div>
                       
                        
                    </div>
                    <div className="h-[68px]  bg-white border-l-3 border-gray-400 rounded-xl flex items-center justify-center w-[260px]">
                        <div className="flex items-center justify-center gap-2 text-[18px] font-normal text-neutral-700">
                            <span>Step 1:</span>
                            <span>Basic Information</span>
                        </div>
                       
                        
                    </div>
                    <div className="h-[68px] bg-white border-l-3 border-gray-400 rounded-xl flex items-center justify-center w-[260px]">
                        <div className="flex items-center justify-center gap-2 text-[18px] font-normal text-neutral-700">
                            <span>Step 1:</span>
                            <span>Basic Information</span>
                        </div>
                       
                        
                    </div>

                </div>

            </div>
           
        </div>
    );
};

export default DetailsTab;