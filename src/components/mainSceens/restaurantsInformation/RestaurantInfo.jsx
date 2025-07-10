import Header from "../../layout/Header";
import DetailsTab from "./DetailsTab";
import { TabProvider } from "./TabContext";
import { useTabHook } from "./useTabHook";

const RestaurantContent = () => {
    const { renderActiveContent } = useTabHook();

    return (
        <div className="flex flex-col gap-6 p-6">
            <Header />

            <div className="flex flex-col">
                <div className="mb-10 mx-auto">
                    <DetailsTab />
                </div>
                <div className="w-full bg-gray-100 h-full">
                    <div className="flex flex-col gap-5 mx-auto max-w-[1140px] p-2">
                        {renderActiveContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};

const RestaurantInfo = () => {
    return (
        <TabProvider>
            <RestaurantContent />
        </TabProvider>
    );
};

export default RestaurantInfo;