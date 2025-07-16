import { useState } from "react";
import LaborInformation from "./LaborInformation";
import LaborEntryMethod from "./LaborEntryMethod";
import { TabProvider } from "../../TabContext";

const LaborInformationWrapper = () => {
    const [laborData, setLaborData] = useState({
        goal: '',
        needsAttention: '',
        danger: '',
        laborEntryMethod: {
            hourlyRate: '',
            entryMethod: 'daily-hours-costs',
            isDailyHoursCostsEnabled: true
        }
    });

    const updateLaborData = (field, value) => {
        setLaborData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    return (
        <TabProvider>
            <div className="flex flex-col">
                <LaborInformation data={laborData} updateData={updateLaborData} />    
                <LaborEntryMethod data={laborData.laborEntryMethod} updateData={updateLaborData} />
            </div>
        </TabProvider>
    )
}   

export default LaborInformationWrapper;