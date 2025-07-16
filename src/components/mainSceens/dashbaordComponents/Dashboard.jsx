import SalesTable from "./SalesTable";

const Dashboard = () => {
    return (
        <div className="border-2 border-red-500">
            <div className="flex flex-col gap-5 container mx-auto justify-center items-center h-full">
                <h1>Dashboard</h1>
                <SalesTable />
            </div>
        </div>
    )
}

export default Dashboard;