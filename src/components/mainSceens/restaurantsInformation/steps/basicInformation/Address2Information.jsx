import SubTrack from '../../../../../assets/svgs/Subtract.svg';
import LeftArrow from '../../../../../assets/svgs/left-arrow.svg';
import { Select } from 'antd';
import { TiArrowLeft } from "react-icons/ti";
import PrimaryButton from '../../../../../components/buttons/Buttons';

const AddressType = ({ data, updateData, onSaveAndContinue }) => {
    return (
        <div className="flex mt-5">
            <div className="w-[40%]">
                <div className="flex flex-col gap-2">
                    <h4 className="text-[26px] !font-bold !mb-0">Address Information </h4>
                    <span className="text-[22px] text-neutral-600">Tell us about your restaurant — name, category, and a short description to help customers get to know you.</span>
                </div>
            </div>
            <div className="w-[60%]">
                <div className="flex flex-col gap-6 p-6 bg-white rounded-xl" >
                    <div className="flex flex-col gap-2">
                        <label htmlFor="sqft" className="text-[20px] !font-bold text-neutral-600 flex items-center gap-2">How many SQFT is your location? <img src={SubTrack} alt="SubTrack" /></label>
                        <input 
                            type="text" 
                            id="sqft" 
                            placeholder="Write SQFT" 
                            className="w-full p-2 border border-gray-300 h-[60px] rounded-md text-[18px] font-normal text-neutral-700"
                            value={data.sqft}
                            onChange={(e) => updateData('sqft', e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label htmlFor="franchise" className="text-[20px] !font-bold text-neutral-600 flex items-center gap-2">Is this location a franchise? <img src={SubTrack} alt="SubTrack" /></label>
                        <Select 
                            type="text" 
                            id="franchise" 
                            placeholder="No" 
                            className="w-full p-2 border border-gray-300 !h-[60px] rounded-md text-[18px] font-normal text-neutral-700"
                            value={data.isFranchise}
                            onChange={(value) => updateData('isFranchise', value)}
                        >
                            <Select.Option value="1">No</Select.Option>
                            <Select.Option value="2">Yes</Select.Option>
                        </Select>                
                    </div>
                    {/* <div className="flex flex-col gap-2">
                        <label htmlFor="royalty" className="text-[20px] !font-bold text-neutral-600 flex items-center gap-2">Royalty % <img src={SubTrack} alt="SubTrack" /></label>
                        <Select 
                            type="text" 
                            id="royalty" 
                            placeholder="Select royalty percentage" 
                            className="w-full p-2 border border-gray-300 !h-[60px] rounded-md text-[18px] font-normal text-neutral-700"
                            value={data.royaltyPercentage}
                            onChange={(value) => updateData('royaltyPercentage', value)}
                        >
                            {Array.from({ length: 35 }, (_, i) => i + 1).map(percentage => (
                                <Select.Option key={percentage} value={percentage}>{percentage}%</Select.Option>
                            ))}
                        </Select>                
                    </div>
                    <div className="flex flex-col gap-2">
                        <label htmlFor="advertisement" className="text-[20px] !font-bold text-neutral-600 flex items-center gap-2">Brand/Advertisement Fee % <img src={SubTrack} alt="SubTrack" /></label>
                        <Select 
                            type="text" 
                            id="advertisement" 
                            placeholder="Select advertisement percentage" 
                            className="w-full p-2 border border-gray-300 !h-[60px] rounded-md text-[18px] font-normal text-neutral-700"
                            value={data.advertisementFee}
                            onChange={(value) => updateData('advertisementFee', value)}
                        >
                            {Array.from({ length: 35 }, (_, i) => i + 1).map(percentage => (
                                <Select.Option key={percentage} value={percentage}>{percentage}%</Select.Option>
                            ))}
                        </Select>                
                    </div> */}
                    <div className="flex flex-col gap-2">
                        <label htmlFor="restaurantType" className="text-[20px] !font-bold text-neutral-600">Restaurant Type</label>
                        <input 
                            type="text" 
                            id="restaurantType" 
                            placeholder="Write Restaurant Type" 
                            className="w-full p-2 border border-gray-300 h-[60px] rounded-md text-[18px] font-normal text-neutral-700"
                            value={data.restaurantType}
                            onChange={(e) => updateData('restaurantType', e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label htmlFor="menuType" className="text-[20px] !font-bold text-neutral-600">Menu Type</label>
                        <input 
                            type="text" 
                            id="menuType" 
                            placeholder="Write Menu Type" 
                            className="w-full p-2 border border-gray-300 h-[60px] rounded-md text-[18px] font-normal text-neutral-700"
                            value={data.menuType}
                            onChange={(e) => updateData('menuType', e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex justify-between items-center my-5">
                        <PrimaryButton icon={LeftArrow} title="Go Back" className="bg-gray-200 text-black h-[60px]"/>
                        <PrimaryButton 
                            title="Save & Continue" 
                            className="btn-brand"
                            onClick={onSaveAndContinue}
                        />
                </div>
            </div>
        </div>
    )
}

export default AddressType;