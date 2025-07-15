import { Select } from "antd";

const RestaurantInformation = ({ data, updateData }) => {
    return (
        <div>
 <div className="flex mt-5">
                            <div className="w-[40%]">
                                <div className="flex flex-col gap-2">
                                    <h4 className="text-lg !font-bold !mb-0">Restaurant Information</h4>
                                    <span className="text-base text-neutral-600">Tell us about your restaurant — name, category, and a short description to help customers get to know you.</span>
                                </div>
                            </div>
                            <div className="w-[60%]">
                                <div className="flex flex-col gap-3 p-6 bg-white rounded-xl" >
                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="restaurantName" className="text-base !font-bold text-neutral-600">Restaurant Name</label>
                                        <input 
                                            type="text" 
                                            id="restaurantName" 
                                            placeholder="Enter your restaurant name" 
                                            className="w-full p-2 border border-gray-300 h-[40px] rounded-md text-base font-normal text-neutral-700 "
                                            value={data.restaurantName}
                                            onChange={(e) => updateData('restaurantName', e.target.value)}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="numberOfLocations" className="text-base !font-bold text-neutral-600">Number of Locations</label>
                                        <Select 
                                            type="text" 
                                            id="numberOfLocations" 
                                            placeholder="Select Locations" 
                                            
                                            className="w-full p-2  !h-[40px] rounded-md text-base font-normal text-neutral-700 outline-none"
                                            value={data.numberOfLocations}
                                            onChange={(value) => updateData('numberOfLocations', value)}
                                            options={[
                                                {value: '1', label: '1'}, 
                                                {value: '2', label: '2', disabled: true}, 
                                                {value: '3', label: '3', disabled: true}, 
                                                {value: '4', label: '4', disabled: true}, 
                                                {value: '5', label: '5', disabled: true}
                                            ]}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="locationName" className="text-base !font-bold text-neutral-600">Location Name</label>
                                        <input 
                                            type="text" 
                                            id="locationName" 
                                            placeholder="Write Location Name" 
                                            className="w-full p-2 border border-gray-300 h-[40px] rounded-md text-base font-normal text-neutral-700 "
                                            value={data.locationName}
                                            onChange={(e) => updateData('locationName', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
        </div>
    )
}

export default RestaurantInformation;