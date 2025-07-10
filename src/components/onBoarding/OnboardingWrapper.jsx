import React from "react";
import OnBoard from "../../assets/pngs/onBoard.png"

import ImageLayout from "../imageWrapper/ImageLayout";
import PrimaryBtn from "../buttons/Buttons";
import { Checkbox } from "antd";
import { FaArrowLeftLong } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";

const OnboardingWrapper = () => {
    const navigate = useNavigate();
        return (
        <div className="min-h-screen flex flex-col lg:flex-row">
            {/* Content Section */}
            <div className="w-full lg:w-1/2 flex items-center justify-center">
                <div className="w-full max-w-sm mx-auto">
                    <div className="flex flex-col gap-4 sm:gap-6">
                        <div>
                        <button className="flex items-center gap-2 text-gray-700 !mb-0">
                        <FaArrowLeftLong />
                        Go Back
                        </button>
                        </div>
                        {/* Header */}
                        <div className="flex flex-col gap-2 sm:gap-2">
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-[36px] font-bold leading-tight !mb-0 !font-bold">
                                Is Your Restaurant Already on Growlio?
                            </h1>
                            <h2 className="text-lg sm:text-xl lg:text-2xl xl:text-[22px] !font-bold text-gray-800 leading-tight !mb-0">
                                Let us know how you’d like to get started.
                            </h2>
                        </div>


                        <div className="flex flex-col gap-8">
                        <div className="border border-gray-300 rounded-lg p-6">
                                <div className="flex items-center gap-2">
                                    <Checkbox />
                                    <span className="text-[20px] font-bold">Yes, My Restaurant Exists</span>

                                </div>
                                <p className="text-[18px] font-regular text-gray-700 leading-relaxed !mb-0">Claim and manage an existing listing.</p>

                            </div>
                            <div className="border border-gray-300 rounded-lg p-6">
                                <div className="flex items-center gap-2">
                                    <Checkbox />
                                    <span className="text-[20px] font-bold">No, I Want to Create a New One</span>

                                </div>
                                <p className="text-[18px] font-regular text-gray-700 leading-relaxed !mb-0"> Register a new restaurant on Growlio.</p>

                            </div>
                        </div>

                    {/* Button */}
                    <div className="mt-2">
                        <PrimaryBtn title="Continue" className="btn-brand w-full text-sm sm:text-base py-3 sm:py-4" onClick={()=>{navigate('/create-restaurant-info')}} />
                    </div>
                    </div>


                </div>
            </div>

            {/* Image Section */ }
    <div className="w-full lg:w-1/2 relative">
        <ImageLayout>
            <div className="relative w-full h-full flex items-end justify-center">
                <img
                    src={OnBoard}
                    alt="onboarding "
                />
            </div>
        </ImageLayout>
    </div>
        </div >
    );
};

export default OnboardingWrapper;
