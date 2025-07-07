import React from "react";
import orderBooker from "../../../assets/auth/happy-man.png"

const AuthWrapper = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-100">
      <div className="w-full lg:w-1/2 flex items-center justify-center">
        <div className="w-full max-w-md">{children}</div>
      </div>
      <div className="w-full lg:w-1/2 hidden lg:block relative">
        <img
          src={orderBooker}
          alt="Order Book"
          className="absolute inset-0 w-full h-screen object-cover"
        />
      </div>
    </div>
  );
};

export default AuthWrapper;
