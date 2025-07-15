import { Select } from 'antd';

const AddressInformation = ({ data, updateData }) => {
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
                    <label htmlFor="address1" className="text-[20px] !font-bold text-neutral-600">Address 1</label>
                    <textarea 
                        type="text" 
                        id="address1" 
                        placeholder="Write Address 1" 
                        className="w-full p-2 border border-gray-300 h-[100px] rounded-md text-[18px] font-normal text-neutral-700"
                        value={data.address1}
                        onChange={(e) => updateData('address1', e.target.value)}
                    />
                </div>
                {/* <div className="flex flex-col gap-2">
                    <label htmlFor="address2" className="text-[20px] !font-bold text-neutral-600">Address 2</label>
                    <textarea 
                        type="text" 
                        id="address2" 
                        placeholder="Write Address 2" 
                        className="w-full p-2 border border-gray-300 h-[100px] rounded-md text-[18px] font-normal text-neutral-700"
                        value={data.address2}
                        onChange={(e) => updateData('address2', e.target.value)}
                    />
                </div> */}
                <div className="flex flex-col gap-2">
                    <label htmlFor="country" className="text-[20px] !font-bold text-neutral-600">Country</label>
                    <Select 
                        id="country" 
                        placeholder="Write Country" 
                        className="w-full !h-[60px] rounded-md text-[18px] font-normal text-neutral-700"
                        value={data.country || undefined}
                        onChange={(value) => updateData('country', value)}
                        style={{ height: '60px' }}
                        allowClear
                    >
                        <Select.Option value="1">United States</Select.Option>
                        <Select.Option value="2">Canada</Select.Option>
                        <Select.Option value="3">United Kingdom</Select.Option>
                    </Select>
                </div>
                <div className="flex flex-col gap-2">
                    <label htmlFor="state" className="text-[20px] !font-bold text-neutral-600">State</label>
                    <Select 
                        id="state" 
                        placeholder="Write State" 
                        className="w-full !h-[60px] rounded-md text-[18px] font-normal text-neutral-700"
                        value={data.state || undefined}
                        onChange={(value) => updateData('state', value)}
                        style={{ height: '60px' }}
                        allowClear
                    >
                        <Select.Option value="1">California</Select.Option>
                        <Select.Option value="2">New York</Select.Option>
                        <Select.Option value="3">Texas</Select.Option>
                    </Select>
                </div>
                <div className="flex flex-col gap-2">
                    <label htmlFor="zipCode" className="text-[20px] !font-bold text-neutral-600">Zip Code</label>
                    <input 
                        type="text" 
                        id="zipCode" 
                        placeholder="Write Zip Code" 
                        className="w-full p-2 border border-gray-300 h-[60px] rounded-md text-[18px] font-normal text-neutral-700"
                        value={data.zipCode}
                        onChange={(e) => updateData('zipCode', e.target.value)}
                    />
                </div>

            </div>
        </div>
    </div>
        )
}

export default AddressInformation;