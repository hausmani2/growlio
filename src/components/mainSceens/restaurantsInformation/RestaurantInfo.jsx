import { Select } from "antd";
import Header from "../../layout/Header";
import DetailsTab from "./DetailsTab";

const RestaurantInfo = () => {
    return (
        <div className="flex flex-col gap-6 p-6">
            <Header />


            <div className="flex flex-col">
                <div className="mb-10 mx-auto">
                    <DetailsTab />
                </div>
                <div className="w-full  bg-gray-100 h-full">

                    <div className="flex flex-col gap-5 mx-auto max-w-[1140px]   p-2 ">
                        <div className="flex mt-5">
                            <div className="w-[40%]">
                                <div className="flex flex-col gap-2">
                                    <h4 className="text-[26px] !font-bold !mb-0">Restaurant Information</h4>
                                    <span className="text-[22px] text-neutral-600">Tell us about your restaurant — name, category, and a short description to help customers get to know you.</span>
                                </div>
                            </div>
                            <div className="w-[60%]">
                                <div className="flex flex-col gap-6 p-6 bg-white rounded-xl" >
                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="restaurantName" className="text-[20px] !font-bold text-neutral-600">Restaurant Name</label>
                                        <input type="text" id="restaurantName" placeholder="Enter your restaurant name" className="w-full p-2 border border-gray-300 h-[60px] rounded-md text-[18px] font-normal text-neutral-700" />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="restaurantName" className="text-[20px] !font-bold text-neutral-600">Number of Locations</label>
                                        <input type="text" id="restaurantName" placeholder="Write Number of Locations" className="w-full p-2 border border-gray-300 h-[60px] rounded-md text-[18px] font-normal text-neutral-700" />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="restaurantName" className="text-[20px] !font-bold text-neutral-600">Location Name</label>
                                        <input type="text" id="restaurantName" placeholder="Write Location Name" className="w-full p-2 border border-gray-300 h-[60px] rounded-md text-[18px] font-normal text-neutral-700" />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="restaurantName" className="text-[20px] !font-bold text-neutral-600">Other Location Name</label>
                                        <input type="text" id="restaurantName" placeholder="Write Other Location Name" className="w-full p-2 border border-gray-300 h-[60px] rounded-md text-[18px] font-normal text-neutral-700" />
                                    </div>

                                </div>
                            </div>









                        </div>
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
                                        <label htmlFor="restaurantName" className="text-[20px] !font-bold text-neutral-600">Address 1</label>
                                        <textarea type="text" id="restaurantName" placeholder="Write Address 1" className="w-full p-2 border border-gray-300 h-[100px] rounded-md text-[18px] font-normal text-neutral-700" />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="restaurantName" className="text-[20px] !font-bold text-neutral-600">Address 2</label>
                                        <textarea type="text" id="restaurantName" placeholder="Write Address 2" className="w-full p-2 border border-gray-300 h-[100px] rounded-md text-[18px] font-normal text-neutral-700" />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="restaurantName" className="text-[20px] !font-bold text-neutral-600">Country</label>
                                        <Select type="text" id="restaurantName" placeholder="Write Country" className="w-full p-2 border border-gray-300 !h-[60px] rounded-md text-[18px] font-normal text-neutral-700" >
                                            <Select.Option value="1">United States</Select.Option>
                                            <Select.Option value="2">Canada</Select.Option>
                                            <Select.Option value="3">United Kingdom</Select.Option>
                                        </Select>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="restaurantName" className="text-[20px] !font-bold text-neutral-600">State</label>
                                        <Select type="text" id="restaurantName" placeholder="Write State" className="w-full p-2 border border-gray-300 !h-[60px] rounded-md text-[18px] font-normal text-neutral-700" >
                                            <Select.Option value="1">California</Select.Option>
                                            <Select.Option value="2">New York</Select.Option>
                                            <Select.Option value="3">Texas</Select.Option>
                                        </Select>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="restaurantName" className="text-[20px] !font-bold text-neutral-600">Zip Code</label>
                                        <input type="text" id="restaurantName" placeholder="Write Zip Code" className="w-full p-2 border border-gray-300 h-[60px] rounded-md text-[18px] font-normal text-neutral-700" />
                                    </div>

                                </div>
                            </div>









                        </div>
                    </div>


                </div>
            </div>
        </div>
    );
};

export default RestaurantInfo;