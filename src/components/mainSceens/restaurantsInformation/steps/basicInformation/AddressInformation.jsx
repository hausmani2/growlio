import { Input, Select } from 'antd';
import useTooltips from '../../../../../utils/useTooltips';
import TooltipIcon from '../../../../common/TooltipIcon';

const AddressInformation = ({ data, updateData, errors = {} }) => {
    const tooltips = useTooltips('onboarding-basic');

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            {/* Header Section */}
            <div className="mb-6">
                <h3 className="text-xl font-bold text-orange-600 mb-2">Address Information</h3>
                <p className="text-gray-600 text-sm">
                    Tell us about your restaurant location and address details.
                </p>
            </div>
            
            {/* Form Fields */}
            <div className="space-y-4">
                {/* Address 1 */}
                <div>
                    <label htmlFor="address1" className="block text-sm font-semibold text-gray-700 mb-2">
                        Address 1 <span className="text-red-500">*</span>
                        <TooltipIcon text={tooltips['address_1']} />
                    </label>
                    <Input.TextArea 
                        id="address1" 
                        placeholder="Enter Address" 
                        className={`w-full h-16 rounded-lg text-sm ${
                            errors.address1 ? 'border-red-500' : 'border-gray-300'
                        }`}
                        value={data.address1}
                        onChange={(e) => updateData('address1', e.target.value)}
                        status={errors.address1 ? 'error' : ''}
                    />
                    {errors.address1 && (
                        <span className="text-red-500 text-xs mt-1">{errors.address1}</span>
                    )}
                </div>
               
                {/* Country */}
                <div>
                    <label htmlFor="country" className="block text-sm font-semibold text-gray-700 mb-2">
                        Country <span className="text-red-500">*</span>
                        <TooltipIcon text={tooltips['country']} />
                    </label>
                    <Select 
                        id="country" 
                        placeholder="Select Country" 
                        className={`w-full h-11 rounded-lg text-sm ${
                            errors.country ? 'border-red-500' : ''
                        }`}
                        value={data.country || undefined}
                        onChange={(value) => updateData('country', value)}
                        status={errors.country ? 'error' : ''}
                        allowClear
                    >
                        <Select.Option value="1">United States</Select.Option>
                        <Select.Option value="2">Canada</Select.Option>
                        <Select.Option value="3">United Kingdom</Select.Option>
                    </Select>
                    {errors.country && (
                        <span className="text-red-500 text-xs mt-1">{errors.country}</span>
                    )}
                </div>
                
                {/* State */}
                <div>
                    <label htmlFor="state" className="block text-sm font-semibold text-gray-700 mb-2">
                        State <span className="text-red-500">*</span>
                        <TooltipIcon text={tooltips['state']} />
                    </label>
                    <Select 
                        id="state" 
                        placeholder="Select State" 
                        className={`w-full h-11 rounded-lg text-sm ${
                            errors.state ? 'border-red-500' : ''
                        }`}
                        value={data.state || undefined}
                        onChange={(value) => updateData('state', value)}
                        status={errors.state ? 'error' : ''}
                        allowClear
                    >
                        <Select.Option value="1">California</Select.Option>
                        <Select.Option value="2">New York</Select.Option>
                        <Select.Option value="3">Texas</Select.Option>
                    </Select>
                    {errors.state && (
                        <span className="text-red-500 text-xs mt-1">{errors.state}</span>
                    )}
                </div>
                
                {/* Zip Code */}
                <div>
                    <label htmlFor="zipCode" className="block text-sm font-semibold text-gray-700 mb-2">
                        Zip Code <span className="text-red-500">*</span>
                        <TooltipIcon text={tooltips['zip_code']} />
                    </label>
                    <Input 
                        type="text" 
                        id="zipCode" 
                        placeholder="Enter Zip Code" 
                        className={`w-full h-11 rounded-lg text-sm ${
                            errors.zipCode ? 'border-red-500' : 'border-gray-300'
                        }`}
                        value={data.zipCode}
                        onChange={(e) => updateData('zipCode', e.target.value)}
                        status={errors.zipCode ? 'error' : ''}
                    />
                    {errors.zipCode && (
                        <span className="text-red-500 text-xs mt-1">{errors.zipCode}</span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddressInformation;