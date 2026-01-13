import SubTrack from '../../../../../assets/svgs/Subtract.svg';
// Use the same icon design as before
import { Input, Select, Tooltip } from 'antd';
import PrimaryButton from '../../../../../components/buttons/Buttons';
import { useTabHook } from '../../useTabHook';
import { useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import useTooltips from '../../../../../utils/useTooltips';
import TooltipIcon from '../../../../common/TooltipIcon';

const AddressType = ({ data, updateData, errors = {}, loading = false, onSaveAndContinue }) => {
    const location = useLocation();
    const { navigateToNextStep, navigateToPreviousStep, activeTab, tabs } = useTabHook();
    
    // Check if this is update mode (accessed from sidebar) or onboarding mode
    const isUpdateMode = !location.pathname.includes('/onboarding');
    
    const handleSaveAndContinueClick = async () => {
        if (onSaveAndContinue) {
            try {
                const result = await onSaveAndContinue();
                if (result?.success) {
                    // Navigate to next step after successful save
                    navigateToNextStep(true); // Skip completion check since we just saved successfully
                }
            } catch (error) {
                console.error('Error in handleSaveAndContinueClick:', error);
            }
        }
    };

    const handleGoBack = () => {
        navigateToPreviousStep();
    };
    
    const tooltips = useTooltips('onboarding-basic');

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            {/* Header Section */}
            <div className="mb-6">
                <h3 className="text-xl font-bold text-orange-600 mb-2">Restaurant Details</h3>
                {/* <p className="text-gray-600 text-sm">
                    Tell us about your restaurant specifications and business details.
                </p> */}
            </div>
            
            {/* Form Fields */}
            <div className="space-y-4">
                {/* SQFT */}
                <div>

                    <label htmlFor="sqft" className="block text-sm font-semibold text-gray-700 mb-2">
                        How many SQFT is your location? <span className="text-red-500">*</span>
                        <TooltipIcon text={tooltips['sqft']} />
                    </label>
                    <Input 
                        type="text" 
                        id="sqft" 
                        placeholder="Enter SQFT" 
                        className={`w-full h-11 rounded-lg text-sm ${
                            errors.sqft ? 'border-red-500' : 'border-gray-300'
                        }`}
                        value={data.sqft}
                        onChange={(e) => updateData('sqft', e.target.value)}
                        status={errors.sqft ? 'error' : ''}
                    />
                    {errors.sqft && (
                        <span className="text-red-500 text-xs mt-1">{errors.sqft}</span>
                    )}
                </div>
                
                {/* Franchise */}
                <div>
                    <label htmlFor="franchise" className="block text-sm font-semibold text-gray-700 mb-2">
                        Is this location a franchise? <span className="text-red-500">*</span>
                        <TooltipIcon text={tooltips['is_franchise']} />
                    </label>
                    <Select 
                        id="franchise" 
                        placeholder="No" 
                        className={`w-full h-11 rounded-lg text-sm ${
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
                        <span className="text-red-500 text-xs mt-1">{errors.isFranchise}</span>
                    )}
                </div>

                {/* Restaurant Type */}
                <div>
                    <label htmlFor="restaurantType" className="block text-sm font-semibold text-gray-700 mb-2">
                        Restaurant Type <span className="text-red-500">*</span>
                        <TooltipIcon text={tooltips['restaurant_type']} />
                    </label>
                    <Select 
                        id="restaurantType" 
                        placeholder="Select Restaurant Type" 
                        className={`w-full h-11 rounded-lg text-sm ${
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
                        <span className="text-red-500 text-xs mt-1">{errors.restaurantType}</span>
                    )}
                </div>
                
                {/* Menu Type */}
                <div>
                    <label htmlFor="menuType" className="block text-sm font-semibold text-gray-700 mb-2">
                        Menu Type <span className="text-red-500">*</span>
                        <TooltipIcon text={tooltips['menu_type']} />
                    </label>
                    <Select 
                        id="menuType" 
                        placeholder="Select Menu Type" 
                        className={`w-full h-11 rounded-lg text-sm ${
                            errors.menuType ? 'border-red-500' : ''
                        }`}
                        value={data.menuType || undefined}
                        onChange={(value) => updateData('menuType', value)}
                        status={errors.menuType ? 'error' : ''}
                    >
                        <Select.Option value="Pizza">Pizza</Select.Option>
                        <Select.Option value="Burgers">Burgers</Select.Option>
                        <Select.Option value="Sandwiches / Subs">Sandwiches / Subs</Select.Option>
                        <Select.Option value="BBQ / Smokehouse">BBQ / Smokehouse</Select.Option>
                        <Select.Option value="Chicken / Wings">Chicken / Wings</Select.Option>
                        <Select.Option value="Seafood">Seafood</Select.Option>
                        <Select.Option value="Steakhouse / Grill">Steakhouse / Grill</Select.Option>
                        <Select.Option value="Italian">Italian</Select.Option>
                        <Select.Option value="Mexican / Tex-Mex">Mexican / Tex-Mex</Select.Option>
                        <Select.Option value="Asian (Chinese, Japanese, Thai, Korean, etc.)">Asian (Chinese, Japanese, Thai, Korean, etc.)</Select.Option>
                        <Select.Option value="Indian">Indian</Select.Option>
                        <Select.Option value="Mediterranean / Greek">Mediterranean / Greek</Select.Option>
                        <Select.Option value="Middle Eastern">Middle Eastern</Select.Option>
                        <Select.Option value="Vegan / Vegetarian">Vegan / Vegetarian</Select.Option>
                        <Select.Option value="Salad / Healthy Bowls">Salad / Healthy Bowls</Select.Option>
                        <Select.Option value="Breakfast / Brunch">Breakfast / Brunch</Select.Option>
                        <Select.Option value="Bakery / Café">Bakery / Café</Select.Option>
                        <Select.Option value="Ice Cream / Gelato / Dessert">Ice Cream / Gelato / Dessert</Select.Option>
                        <Select.Option value="Deli">Deli</Select.Option>
                        <Select.Option value="American / Diner">American / Diner</Select.Option>
                        <Select.Option value="Latin / Caribbean">Latin / Caribbean</Select.Option>
                        <Select.Option value="Fusion">Fusion</Select.Option>
                    </Select>
                    {errors.menuType && (
                        <span className="text-red-500 text-xs mt-1">{errors.menuType}</span>
                    )}
                </div>
            </div>
            
            {/* Navigation Buttons */}
            {!isUpdateMode && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-6">
                    <PrimaryButton 
                        title="" 
                        className="border-none w-full sm:w-auto"
                        disabled={loading}
                    />
                    <div className="flex gap-3">
                        {activeTab < tabs.length - 1 && (
                            <PrimaryButton 
                                title="Skip" 
                                className="bg-gray-200 text-gray-700 w-full sm:w-auto" 
                                onClick={() => navigateToNextStep(true)} 
                                disabled={loading} 
                            />
                        )}
                        <PrimaryButton 
                            title={loading ? "Saving..." : "Save & Continue"} 
                            className="btn-brand w-full sm:w-auto"
                            onClick={handleSaveAndContinueClick}
                            disabled={loading}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddressType;