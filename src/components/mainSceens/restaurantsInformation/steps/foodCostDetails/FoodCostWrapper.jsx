import { useState } from "react";
import FoodCostDetails from "./FoodCostDetails";
import DeliveryFrequency from "./DeliveryFrequency";
import ThirdPartyProviders from "./ThirdPartyProviders";
import { TabProvider } from "../../TabContext";

const FoodCostWrapper = () => {
    // State for Food Cost Details
    const [foodCostData, setFoodCostData] = useState({
        cogsGoal: ""
    });

    // State for Delivery Frequency
    const [deliveryData, setDeliveryData] = useState({
        selectedDays: {}
    });

    // State for Third Party Providers
    const [thirdPartyData, setThirdPartyData] = useState({
        providers: []
    });

    // Function to update food cost data
    const updateFoodCostData = (field, value) => {
        setFoodCostData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Function to update delivery data
    const updateDeliveryData = (field, value) => {
        setDeliveryData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Function to update third party data
    const updateThirdPartyData = (field, value) => {
        setThirdPartyData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Function to handle save and continue
    const handleSaveAndContinue = () => {
        const allFormData = {
            foodCost: foodCostData,
            delivery: deliveryData
        };
        
        console.log("Food Cost and Delivery Data:", allFormData);
        
        // Here you can add your API call to save the data
        // Example: saveFormData(allFormData);
        
        // You can also add navigation logic here
        // Example: navigate to next step
    };

    return (
        <TabProvider>
            <div className="flex flex-col">
                <FoodCostDetails 
                    data={foodCostData}
                    updateData={updateFoodCostData}
                />
                    <ThirdPartyProviders
                        data={thirdPartyData}
                        updateData={updateThirdPartyData}
                    />
                <DeliveryFrequency 
                    data={deliveryData}
                    updateData={updateDeliveryData}
                    onSaveAndContinue={handleSaveAndContinue}
                />
            </div>
        </TabProvider>
    )
}

export default FoodCostWrapper;