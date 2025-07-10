import { useState } from "react";
import SalesChannel from "./SalesChannel";
import ThirdPartyProviders from "./ThirdPartyProviders";

const SalesChannelsWrapper = () => {
    // State for Sales Channels
    const [salesChannelsData, setSalesChannelsData] = useState({
        inStoreSales: true,
        onlineSales: false,
        appSales: false,
        thirdPartySales: false
    });

    // Function to update sales channels data
    const updateSalesChannelsData = (field, value) => {
        setSalesChannelsData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    return (
        <div>
            <div className="flex flex-col gap-6">
                <SalesChannel 
                    data={{ salesChannels: salesChannelsData }}
                    updateData={updateSalesChannelsData}
                />
                {/* <ThirdPartyProviders
                    data={{ salesChannels: salesChannelsData }}
                    updateData={updateSalesChannelsData}
                /> */}
            </div>
        </div>
    )
}

export default SalesChannelsWrapper;