import React from "react";
import orderBooker from "../../../assets/auth/happy-man.png"

const AuthWrapper = ({ children }) => {
  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden flex flex-col lg:flex-row bg-gradient-to-br from-gray-50 to-white">
      {/* Left Section - Form */}
      <div className="w-full lg:w-1/2 min-h-screen flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
      
      {/* Right Section - Image */}
      <div className="w-full lg:w-1/2 hidden lg:block relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-orange-100 opacity-50"></div>
        
        {/* Decorative Elements */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-orange-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-32 left-16 w-24 h-24 bg-orange-300 rounded-full opacity-30 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-8 w-16 h-16 bg-orange-400 rounded-full opacity-20 animate-pulse delay-500"></div>
        
        {/* Main Image */}
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="text-center text-white relative z-20 mb-8">
            <h2 className="text-4xl font-bold mb-4 drop-shadow-lg">
              Welcome to Growlio
            </h2>
            <p className="text-xl opacity-90 drop-shadow-md max-w-md mx-auto">
              Transform your restaurant business with data-driven insights and smart management tools.
            </p>
          </div>
        </div>
        
        <img
          src={orderBooker}
          alt="Restaurant Professional"
          className="absolute inset-0 w-full h-full object-cover object-[20%_0%] z-10"
        />
        
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black bg-opacity-30 z-5"></div>
      </div>
    </div>
  );
};

export default AuthWrapper;
