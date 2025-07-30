import { Input, Select } from "antd";

const RestaurantInformation = ({ data, updateData, errors = {} }) => {
    return (
        <div>
            <div className="flex mt-5">
                <div className="w-[40%]">
                    <div className="flex flex-col gap-2">
                        <h4 className="text-lg !font-bold !mb-0">Restaurant Information</h4>
                        <span className="text-base text-neutral-600">
                            Tell us about your restaurant — name, category, and a short description to help customers get to know you.
                        </span>
                    </div>
                </div>
                <div className="w-[60%]">
                    <div className="flex flex-col gap-3 p-6 bg-white rounded-xl">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="restaurantName" className="text-base !font-bold text-neutral-600">
                                Restaurant Name <span className="text-red-500">*</span>
                            </label>
                            <Input 
                                type="text" 
                                id="restaurantName" 
                                placeholder="Enter your restaurant name" 
                                className={`w-full p-2 border h-[40px] rounded-md text-base font-normal text-neutral-700 ${
                                    errors.restaurantName ? 'border-red-500' : 'border-gray-300'
                                }`}
                                value={data.restaurantName}
                                onChange={(e) => updateData('restaurantName', e.target.value)}
                                status={errors.restaurantName ? 'error' : ''}
                            />
                            {errors.restaurantName && (
                                <span className="text-red-500 text-sm">{errors.restaurantName}</span>
                            )}
                        </div>
                        
                        <div className="flex flex-col gap-2">
                            <label htmlFor="numberOfLocations" className="text-base !font-bold text-neutral-600">
                                Number of Locations <span className="text-red-500">*</span>
                            </label>
                            <Select 
                                id="numberOfLocations" 
                                placeholder="Select Locations" 
                                className={`w-full !h-[40px] rounded-md text-base font-normal text-neutral-700 ${
                                    errors.numberOfLocations ? 'border-red-500' : ''
                                }`}
                                value={data.numberOfLocations}
                                onChange={(value) => updateData('numberOfLocations', value)}
                                status={errors.numberOfLocations ? 'error' : ''}
                                options={[
                                    { value: '1', label: '1' }, 
                                    { value: '2', label: '2', disabled: true }, 
                                    { value: '3', label: '3', disabled: true }, 
                                    { value: '4', label: '4', disabled: true }, 
                                    { value: '5', label: '5', disabled: true }
                                ]}
                            />
                            {errors.numberOfLocations && (
                                <span className="text-red-500 text-sm">{errors.numberOfLocations}</span>
                            )}
                        </div>
                        
                        <div className="flex flex-col gap-2">
                            <label htmlFor="locationName" className="text-base !font-bold text-neutral-600">
                                Location Name <span className="text-red-500">*</span>
                            </label>
                            <Input 
                                type="text" 
                                id="locationName" 
                                placeholder="Enter your location" 
                                className={`w-full p-2 border h-[40px] rounded-md text-base font-normal text-neutral-700 ${
                                    errors.locationName ? 'border-red-500' : 'border-gray-300'
                                }`}
                                value={data.locationName || ""}
                                onChange={(e) => {
                                    console.log('Location name changed to:', e.target.value);
                                    updateData('locationName', e.target.value);
                                }}
                                status={errors.locationName ? 'error' : ''}
                            />
                            {errors.locationName && (
                                <span className="text-red-500 text-sm">{errors.locationName}</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RestaurantInformation;