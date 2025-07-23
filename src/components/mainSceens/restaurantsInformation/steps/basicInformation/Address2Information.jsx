import SubTrack from '../../../../../assets/svgs/Subtract.svg';
import { Input, Select, Tooltip } from 'antd';
import PrimaryButton from '../../../../../components/buttons/Buttons';
import { useTabHook } from '../../useTabHook';

const AddressType = ({ data, updateData, errors = {}, loading = false, onSaveAndContinue }) => {
    const { navigateToNextStep, navigateToPreviousStep } = useTabHook();
    
    const handleSaveAndContinueClick = async () => {
        if (onSaveAndContinue) {
            try {
                const result = await onSaveAndContinue();
                if (result?.success) {
                    // Navigate to next step after successful save
                    navigateToNextStep();
                }
            } catch (error) {
                console.error('Error in handleSaveAndContinueClick:', error);
            }
        }
    };

    const handleGoBack = () => {
        navigateToPreviousStep();
    };
    
    return (
        <div className="flex mt-5">
            <div className="w-[40%]">
                <div className="flex flex-col gap-2">
                    <h4 className="text-lg !font-bold !mb-0">Restaurant Details</h4>
                    <span className="text-base text-neutral-600">
                        Tell us about your restaurant — name, category, and a short description to help customers get to know you.
                    </span>
                </div>
            </div>
            <div className="w-[60%]">
                <div className="flex flex-col gap-3 p-6 bg-white rounded-xl">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="sqft" className="text-base !font-bold text-neutral-600 flex items-center gap-2">
                            How many SQFT is your location? <span className="text-red-500">*</span>
                            <Tooltip placement="bottomLeft" title="Enter the total square footage of your restaurant location">
                                <img src={SubTrack} alt="SubTrack" />
                            </Tooltip>
                        </label>
                        <Input 
                            type="text" 
                            id="sqft" 
                            placeholder="Enter SQFT" 
                            className={`w-full p-2 border h-[40px] rounded-md text-base font-normal text-neutral-700 ${
                                errors.sqft ? 'border-red-500' : 'border-gray-300'
                            }`}
                            value={data.sqft}
                            onChange={(e) => updateData('sqft', e.target.value)}
                            status={errors.sqft ? 'error' : ''}
                        />
                        {errors.sqft && (
                            <span className="text-red-500 text-sm">{errors.sqft}</span>
                        )}
                    </div>
                    
                    <div className="flex flex-col gap-2">
                        <label htmlFor="franchise" className="text-base !font-bold text-neutral-600 flex items-center gap-2">
                            Is this location a franchise? <span className="text-red-500">*</span>
                            <Tooltip placement="bottomLeft" title="Select whether this restaurant location is part of a franchise or independently owned">
                                <img src={SubTrack} alt="SubTrack" />
                            </Tooltip>
                        </label>
                        <Select 
                            id="franchise" 
                            placeholder="No" 
                            className={`w-full !h-[40px] rounded-md text-base font-normal text-neutral-700 ${
                                errors.isFranchise ? 'border-red-500' : ''
                            }`}
                            value={data.isFranchise || undefined}
                            onChange={(value) => updateData('isFranchise', value)}
                            status={errors.isFranchise ? 'error' : ''}
                        >
                            <Select.Option value="1">No</Select.Option>
                            <Select.Option value="2">Yes</Select.Option>
                        </Select>
                        {errors.isFranchise && (
                            <span className="text-red-500 text-sm">{errors.isFranchise}</span>
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="restaurantType" className="text-base !font-bold text-neutral-600">
                            Restaurant Type <span className="text-red-500">*</span>
                        </label>
                        <Input 
                            type="text" 
                            id="restaurantType" 
                            placeholder="Enter Restaurant Type" 
                            className={`w-full p-2 border h-[40px] rounded-md text-base font-normal text-neutral-700 ${
                                errors.restaurantType ? 'border-red-500' : 'border-gray-300'
                            }`}
                            value={data.restaurantType}
                            onChange={(e) => updateData('restaurantType', e.target.value)}
                            status={errors.restaurantType ? 'error' : ''}
                        />
                        {errors.restaurantType && (
                            <span className="text-red-500 text-sm">{errors.restaurantType}</span>
                        )}
                    </div>
                    
                    <div className="flex flex-col gap-2">
                        <label htmlFor="menuType" className="text-base !font-bold text-neutral-600">
                            Menu Type <span className="text-red-500">*</span>
                        </label>
                        <Input 
                            type="text" 
                            id="menuType" 
                            placeholder="Enter Menu Type" 
                            className={`w-full p-2 border h-[40px] rounded-md text-base font-normal text-neutral-700 ${
                                errors.menuType ? 'border-red-500' : 'border-gray-300'
                            }`}
                            value={data.menuType}
                            onChange={(e) => updateData('menuType', e.target.value)}
                            status={errors.menuType ? 'error' : ''}
                        />
                        {errors.menuType && (
                            <span className="text-red-500 text-sm">{errors.menuType}</span>
                        )}
                    </div>
                </div>
                
                <div className="flex justify-between items-center my-5">
                    <PrimaryButton 
                        title="Back" 
                        className="border-none"
                        onClick={handleGoBack}
                        disabled={loading}
                    />
                    <PrimaryButton 
                        title={loading ? "Saving..." : "Save & Continue"} 
                        className="btn-brand"
                        onClick={handleSaveAndContinueClick}
                        disabled={loading}
                    />
                </div>
            </div>
        </div>
    );
};

export default AddressType;