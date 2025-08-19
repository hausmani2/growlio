import React from "react";
import Staff from "../../../assets/pngs/shaff.png"
import Cafe from "../../../assets/pngs/cafe.png"

import ImageLayout from "../../imageWrapper/ImageLayout";
import PrimaryBtn from "../../buttons/Buttons";
import { useNavigate } from "react-router-dom";

const Congratulations = () => {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden flex flex-col lg:flex-row">
            {/* Content Section */}
            <div className="w-full h-screen lg:w-1/2 flex items-center justify-center px-4 sm:px-6 lg:px-8">
                <div className="w-full max-w-sm mx-auto">
                    <div className="flex flex-col gap-4 sm:gap-6">
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
                        <div className="flex justify-center">
                            <img 
                                src={Cafe} 
                                alt="Cafe illustration" 
                                className="object-cover h-[40vh] sm:h-[50vh] lg:h-[60vh] max-h-[400px] w-auto" 
                            />
                        </div>

                        {/* Description */}
                        <div className="text-center">
                            <p className="text-sm sm:text-base lg:text-lg xl:text-[16px] font-medium text-gray-700">
                                You can now register your restaurant, set up your menu, manage bookings, and more — all from your dashboard.
                            </p>
                        </div>

                        {/* Button */}
                        <div className="mt-4 sm:mt-6">
                            <PrimaryBtn 
                                title="Continue" 
                                className="btn-brand w-full text-sm sm:text-base py-3 sm:py-4"
                                onClick={()=>{navigate('/onboarding')}} 
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Image Section */}
            <div className="hidden lg:block w-full lg:w-1/2 relative">
                <ImageLayout>
                    <div className="relative flex items-end justify-center">
                        <img
                            src={Staff}
                            className="h-[calc(100vh-100px)] object-cover"
                            alt="Staff illustration"
                        />
                    </div>
                </ImageLayout>
            </div>
        </div>
    );
};

export default Congratulations;
