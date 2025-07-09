import React from "react";
import orderBooker from "../../../assets/auth/happy-man.png"

const AuthWrapper = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="w-full lg:w-1/2 h-full flex items-center justify-center">
        <div className="w-full max-w-sm">{children}</div>
      </div>
      <div className="w-full lg:w-1/2 hidden lg:block relative">
        <img
          src={orderBooker}
          alt="Order Book"
          className="absolute inset-0 w-full h-full object-cover object-[20%_0%]"
        />
      </div>
    </div>
  );
};

export default AuthWrapper;
