import SalesTable from "./SalesTable";
import CogsTable from "./CogsTable";

const Dashboard = () => {
    return (
        <div className="">
            <div className="gap-6 flex flex-col container mx-auto justify-center items-center h-full">
                <SalesTable />
                <CogsTable />
            </div>
        </div>
    )
}

export default Dashboard;