import Header from "../../layout/Header";
import Card from "../../../assets/pngs/cafe.png";
import PrimaryBtn from "../../buttons/Buttons";
import { useNavigate } from "react-router-dom";

const CompleteSteps = () => {
    const navigate = useNavigate();
    return (
        <div className=" flex flex-col gap-6 px-5 h-screen bg-white">
           <Header />
           <div className="flex flex-col gap-5 container mx-auto justify-center items-center h-full">
            <div className="flex flex-col justify-center items-center gap-2">
                <h2 className="text-2xl !font-bold !mb-0"> 🎉 Congratulations!</h2>
                <div className="flex items-center flex-col ">

                <span className="text-base font-medium  text-neutral-600">You've successfully completed all your restaurant setup details.</span>
                    <span className="text-base font-medium  text-neutral-600"> Your dashboard is now ready — start exploring, managing, and growing your business!</span>
                </div>

            </div>
            <img src={Card} alt="cafe" className="w-[400px] h-[370px] object-cover " />

            <PrimaryBtn title="Go to Dashboard" className="btn-brand w-[500px]" onClick={() => navigate("/dashboard")} />

           </div>

        </div>
    )
}

export default CompleteSteps;