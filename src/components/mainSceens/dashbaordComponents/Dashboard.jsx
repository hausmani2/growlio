import SalesTable from "./SalesTable";
import CogsTable from "./CogsTable";
import LabourTable from "./LabourTable";
import ProfitCogsTable from "./ProfitCogsTable";
import FixedExpenseTable from "./FixedExpenseTable";
import NetProfitTable from "./NetProfitTable";

const Dashboard = () => {
    return (
        <div className="">
            <div className="gap-6 flex flex-col container mx-auto justify-center items-center h-full">
                <SalesTable />
                <CogsTable />
                <LabourTable />
                <ProfitCogsTable /> 
                <FixedExpenseTable />
                <NetProfitTable />
            </div>
        </div>
    )
}

export default Dashboard;