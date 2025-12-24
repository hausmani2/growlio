import React from "react";
import PlaneOrangeImg from "../../assets/pngs/plane-orange.png"
import Mask from "../../assets/pngs/Mask-group.png"

function ImageLayout({ children }) {
  return (
    <div className="w-full h-screen relative">
      <img 
        src={PlaneOrangeImg} 
        alt="Plane Orange" 
        className="w-full object-cover h-screen z-0"
      />
      <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6 md:p-8  z-20">
        <div className="">
          {children}
        </div>
      </div>
    </div>
  );
}

export default ImageLayout;
