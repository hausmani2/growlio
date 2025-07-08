import React from "react";
import PlaneOrangeImg from "../../assets/pngs/plane-orange.png"
import Mask from "../../assets/pngs/Mask-group.png"

function ImageLayout({ children }) {
  return (
    <div className="w-full h-full relative">
      <img 
        src={PlaneOrangeImg} 
        alt="Plane Orange" 
        className="w-full h-full object-cover z-0"
      />
      <img 
        src={Mask} 
        alt="Mask Group" 
        className="absolute top-0 left-0 w-full h-full object-center z-10"
      />
      <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-10 z-20">
        <div className="">
          {children}
        </div>
      </div>
    </div>
  );
}

export default ImageLayout;
