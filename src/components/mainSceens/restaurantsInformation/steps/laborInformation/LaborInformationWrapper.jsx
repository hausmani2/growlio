import { useState } from "react";
import LaborInformation from "./LaborInformation";
import LaborEntryMethod from "./LaborEntryMethod";

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
        <div className="flex flex-col gap-6">
            <LaborInformation data={laborData} updateData={updateLaborData} />    
            <LaborEntryMethod data={laborData.laborEntryMethod} updateData={updateLaborData} />
        </div>
    )
}   

export default LaborInformationWrapper;