import { useState } from "react";
import RestaurantInformation from "./RestaurantInformation";
import AddressInformation from "./AddressInformation";
import AddressType from "./Address2Information";

const RestaurantWrapper = () => {
    // State for Restaurant Information
    const [restaurantData, setRestaurantData] = useState({
        restaurantName: "",
        numberOfLocations: undefined,
        locationName: "",
        otherLocationName: ""
    });

    // State for Address Information
    const [addressData, setAddressData] = useState({
        address1: "",
        address2: "",
        country: "",
        state: "",
        zipCode: ""
    });

    // State for Address Type Information
    const [addressTypeData, setAddressTypeData] = useState({
        sqft: "",
        isFranchise: "",
        royaltyPercentage: "",
        advertisementFee: "",
        restaurantType: "",
        menuType: ""
    });

    // Function to update restaurant data
    const updateRestaurantData = (field, value) => {
        setRestaurantData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Function to update address data
    const updateAddressData = (field, value) => {
        setAddressData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Function to update address type data
    const updateAddressTypeData = (field, value) => {
        setAddressTypeData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Function to handle save and continue
    const handleSaveAndContinue = () => {
        const allFormData = {
            restaurant: restaurantData,
            address: addressData,
            addressType: addressTypeData
        };
        
        console.log("All form data:", allFormData);
        
        // Here you can add your API call to save the data
        // Example: saveFormData(allFormData);
        
        // You can also add navigation logic here
        // Example: navigate to next step
    };

    return (
        <div className="flex flex-col gap-6 ">
            <RestaurantInformation 
                data={restaurantData}
                updateData={updateRestaurantData}
            />
            <AddressInformation 
                data={addressData}
                updateData={updateAddressData}
            />
            <AddressType 
                data={addressTypeData}
                updateData={updateAddressTypeData}
                onSaveAndContinue={handleSaveAndContinue}
            />
        </div>
    )
}

export default RestaurantWrapper;