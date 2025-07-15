import React from "react";
import Staff from "../../../assets/pngs/shaff.png"
import Cafe from "../../../assets/pngs/cafe.png"

import ImageLayout from "../../imageWrapper/ImageLayout";
import PrimaryBtn from "../../buttons/Buttons";
import { useNavigate } from "react-router-dom";

const Congratulations = () => {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen flex flex-col lg:flex-row">
            {/* Content Section */}
            <div className="w-full h-screen lg:w-1/2 flex items-center justify-center">
                <div className="w-full max-w-sm mx-auto">
                    <div className="flex flex-col gap-4">
                        {/* Header */}
                        <div className="flex flex-col gap-2 sm:gap-2">
                            <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-[22px] font-bold leading-tight !mb-0 !font-bold">
                                🎉 Congratulations!
                            </h1>
                            <h2 className="text-base sm:text-lg lg:text-xl xl:text-[18px] !font-bold text-gray-800 leading-tight !mb-0">
                                Your account has been successfully created.
                            </h2>
                        </div>

                        {/* Cafe Image */}
                        <div className=" ">
                            <img 
                                src={Cafe} 
                                alt="Cafe illustration" 
                                className=" object-cover h-[calc(60vh-100px)]" 
                            />
                        </div>

                        {/* Description */}
                        <div className="">
                            <p className="text-sm sm:text-base lg:text-lg xl:text-[16px] font-medium text-gray-700 ">
                                You can now register your restaurant, set up your menu, manage bookings, and more — all from your dashboard.
                            </p>
                        </div>

                        {/* Button */}
                        <div className="">
                            <PrimaryBtn title="Continue" className="btn-brand w-full text-sm sm:text-base py-3"
                            onClick={()=>{navigate('/onboarding')}} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Image Section */}
            <div className="w-full lg:w-1/2 relative">
                <ImageLayout>
                    <div className="relative flex items-end justify-center ">
                        <img
                            src={Staff}
                            className="h-[calc(100vh-100px)] object-cover"
                            alt="Staff illustration"
                            // className="w-4/5 sm:w-3/4 md:w-[70%] lg:w-[65%] xl:w-[60%] h-auto object-contain max-h-[80vh] lg:max-h-[85vh]"
                        />
                    </div>
                </ImageLayout>
            </div>
        </div>
    );
};

export default Congratulations;
