import { Input, Select } from 'antd';

const AddressInformation = ({ data, updateData, errors = {} }) => {
    return (
        <div className="flex mt-5">
            <div className="w-[40%]">
                <div className="flex flex-col gap-2">
                    <h4 className="text-lg !font-bold !mb-0">Address Information</h4>
                    <span className="text-base text-neutral-600">
                        Tell us about your restaurant — name, category, and a short description to help customers get to know you.
                    </span>
                </div>
            </div>
            <div className="w-[60%]">
                <div className="flex flex-col gap-3 p-6 bg-white rounded-xl">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="address1" className="text-base !font-bold text-neutral-600">
                            Address 1 <span className="text-red-500">*</span>
                        </label>
                        <Input.TextArea 
                            id="address1" 
                            placeholder="Enter Address" 
                            className={`w-full p-2 border h-[60px] rounded-md text-base font-normal text-neutral-700 ${
                                errors.address1 ? 'border-red-500' : 'border-gray-300'
                            }`}
                            value={data.address1}
                            onChange={(e) => updateData('address1', e.target.value)}
                            status={errors.address1 ? 'error' : ''}
                        />
                        {errors.address1 && (
                            <span className="text-red-500 text-sm">{errors.address1}</span>
                        )}
                    </div>
                   
                    <div className="flex flex-col gap-2">
                        <label htmlFor="country" className="text-base !font-bold text-neutral-600">
                            Country <span className="text-red-500">*</span>
                        </label>
                        <Select 
                            id="country" 
                            placeholder="Select Country" 
                            className={`w-full !h-[40px] rounded-md text-base font-normal text-neutral-700 ${
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
                            <span className="text-red-500 text-sm">{errors.country}</span>
                        )}
                    </div>
                    
                    <div className="flex flex-col gap-2">
                        <label htmlFor="state" className="text-base !font-bold text-neutral-600">
                            State <span className="text-red-500">*</span>
                        </label>
                        <Select 
                            id="state" 
                            placeholder="Select State" 
                            className={`w-full !h-[40px] rounded-md text-base font-normal text-neutral-700 ${
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
                            <span className="text-red-500 text-sm">{errors.state}</span>
                        )}
                    </div>
                    
                    <div className="flex flex-col gap-2">
                        <label htmlFor="zipCode" className="text-base !font-bold text-neutral-600">
                            Zip Code <span className="text-red-500">*</span>
                        </label>
                        <Input 
                            type="text" 
                            id="zipCode" 
                            placeholder="Enter Zip Code" 
                            className={`w-full p-2 border h-[40px] rounded-md text-base font-normal text-neutral-700 ${
                                errors.zipCode ? 'border-red-500' : 'border-gray-300'
                            }`}
                            value={data.zipCode}
                            onChange={(e) => updateData('zipCode', e.target.value)}
                            status={errors.zipCode ? 'error' : ''}
                        />
                        {errors.zipCode && (
                            <span className="text-red-500 text-sm">{errors.zipCode}</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddressInformation;