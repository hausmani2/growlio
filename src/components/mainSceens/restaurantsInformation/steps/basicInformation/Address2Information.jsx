import SubTrack from '../../../../../assets/svgs/Subtract.svg';
import { Input, Select, Tooltip } from 'antd';
import PrimaryButton from '../../../../../components/buttons/Buttons';
import { useTabHook } from '../../useTabHook';
import { useLocation } from 'react-router-dom';

const AddressType = ({ data, updateData, errors = {}, loading = false, onSaveAndContinue }) => {
    const location = useLocation();
    const { navigateToNextStep, navigateToPreviousStep } = useTabHook();
    
    // Check if this is update mode (accessed from sidebar) or onboarding mode
    const isUpdateMode = !location.pathname.includes('/onboarding');
    
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
        <div className="flex flex-col lg:flex-row mt-5 gap-4 lg:gap-0">
            <div className="w-full lg:w-[40%]">
                <div className="flex flex-col gap-2">
                    <h4 className="text-lg !font-bold !mb-0">Restaurant Details</h4>
                    <span className="text-sm sm:text-base text-neutral-600">
                        Tell us about your restaurant — name, category, and a short description to help customers get to know you.
                    </span>
                </div>
            </div>
            <div className="w-full lg:w-[60%]">
                <div className="flex flex-col gap-3 p-4 sm:p-6 bg-white rounded-xl">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="sqft" className="text-sm sm:text-base !font-bold text-neutral-600 flex items-center gap-2">
                            How many SQFT is your location? <span className="text-red-500">*</span>
                            <Tooltip placement="bottomLeft" title="Enter the total square footage of your restaurant location">
                                <img src={SubTrack} alt="SubTrack" className="w-4 h-4 sm:w-5 sm:h-5" />
                            </Tooltip>
                        </label>
                        <Input 
                            type="text" 
                            id="sqft" 
                            placeholder="Enter SQFT" 
                            className={`w-full p-2 border h-[40px] rounded-md text-sm sm:text-base font-normal text-neutral-700 ${
                                errors.sqft ? 'border-red-500' : 'border-gray-300'
                            }`}
                            value={data.sqft}
                            onChange={(e) => updateData('sqft', e.target.value)}
                            status={errors.sqft ? 'error' : ''}
                        />
                        {errors.sqft && (
                            <span className="text-red-500 text-xs sm:text-sm">{errors.sqft}</span>
                        )}
                    </div>
                    
                    <div className="flex flex-col gap-2">
                        <label htmlFor="franchise" className="text-sm sm:text-base !font-bold text-neutral-600 flex items-center gap-2">
                            Is this location a franchise? <span className="text-red-500">*</span>
                            <Tooltip placement="bottomLeft" title="Select whether this restaurant location is part of a franchise or independently owned">
                                <img src={SubTrack} alt="SubTrack" className="w-4 h-4 sm:w-5 sm:h-5" />
                            </Tooltip>
                        </label>
                        <Select 
                            id="franchise" 
                            placeholder="No" 
                            className={`w-full !h-[40px] rounded-md text-sm sm:text-base font-normal text-neutral-700 ${
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
                            <span className="text-red-500 text-xs sm:text-sm">{errors.isFranchise}</span>
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="restaurantType" className="text-sm sm:text-base !font-bold text-neutral-600">
                            Restaurant Type <span className="text-red-500">*</span>
                        </label>
                        <Select 
                            id="restaurantType" 
                            placeholder="Select Restaurant Type" 
                            className={`w-full !h-[40px] rounded-md text-sm sm:text-base font-normal text-neutral-700 ${
                                errors.restaurantType ? 'border-red-500' : ''
                            }`}
                            value={data.restaurantType || undefined}
                            onChange={(value) => updateData('restaurantType', value)}
                            status={errors.restaurantType ? 'error' : ''}
                        >
                            <Select.Option value="Buffet">Buffet</Select.Option>
                            <Select.Option value="Café / Coffee Shop">Café / Coffee Shop</Select.Option>
                            <Select.Option value="Fast Casual">Fast Casual</Select.Option>
                            <Select.Option value="Fast Food">Fast Food</Select.Option>
                            <Select.Option value="Fine Dining">Fine Dining</Select.Option>
                            <Select.Option value="Food Truck">Food Truck</Select.Option>
                            <Select.Option value="Full Service">Full Service</Select.Option>
                            <Select.Option value="Ghost Kitchen / Virtual Brand">Ghost Kitchen / Virtual Brand</Select.Option>
                            <Select.Option value="Pop-Up Restaurant">Pop-Up Restaurant</Select.Option>
                        </Select>
                        {errors.restaurantType && (
                            <span className="text-red-500 text-xs sm:text-sm">{errors.restaurantType}</span>
                        )}
                    </div>
                    
                    <div className="flex flex-col gap-2">
                        <label htmlFor="menuType" className="text-sm sm:text-base !font-bold text-neutral-600">
                            Menu Type <span className="text-red-500">*</span>
                        </label>
                        <Select 
                            id="menuType" 
                            placeholder="Select Menu Type" 
                            className={`w-full !h-[40px] rounded-md text-sm sm:text-base font-normal text-neutral-700 ${
                                errors.menuType ? 'border-red-500' : ''
                            }`}
                            value={data.menuType || undefined}
                            onChange={(value) => updateData('menuType', value)}
                            status={errors.menuType ? 'error' : ''}
                        >
                            <Select.Option value="American (Traditional)">American (Traditional)</Select.Option>
                            <Select.Option value="BBQ">BBQ</Select.Option>
                            <Select.Option value="Bowls">Bowls</Select.Option>
                            <Select.Option value="Breakfast / Brunch">Breakfast / Brunch</Select.Option>
                            <Select.Option value="Burgers">Burgers</Select.Option>
                            <Select.Option value="Coffee / Tea">Coffee / Tea</Select.Option>
                            <Select.Option value="Chinese">Chinese</Select.Option>
                            <Select.Option value="Desserts / Ice Cream">Desserts / Ice Cream</Select.Option>
                            <Select.Option value="Indian">Indian</Select.Option>
                        </Select>
                        {errors.menuType && (
                            <span className="text-red-500 text-xs sm:text-sm">{errors.menuType}</span>
                        )}
                    </div>
                </div>
                
                {!isUpdateMode && (
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 my-5">
                        <PrimaryButton 
                            title="Back" 
                            className="border-none w-full sm:w-auto"
                            onClick={handleGoBack}
                            disabled={loading}
                        />
                        <PrimaryButton 
                            title={loading ? "Saving..." : "Save & Continue"} 
                            className="btn-brand w-full sm:w-auto"
                            onClick={handleSaveAndContinueClick}
                            disabled={loading}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default AddressType;