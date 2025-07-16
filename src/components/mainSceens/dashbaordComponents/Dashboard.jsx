import SalesTable from "./SalesTable";

const Dashboard = () => {
    return (
        <div className="">
            <div className="flex flex-col gap-5 container mx-auto justify-center items-center h-full">
                <SalesTable />
            </div>
        </div>
    )
}

export default Dashboard;