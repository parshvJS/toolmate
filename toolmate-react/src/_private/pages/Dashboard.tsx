import MateyExpression from "@/components/custom/MateyExpression";
import { useUser } from "@clerk/clerk-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";
import { ArrowDownToDot, LoaderPinwheel, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import TradingVolumeSlider from "@/components/custom/Slider";
export default function Dashboard() {
    // const { isLoaded, isSignedIn, user } = useUser();
    const [mainInput, setMainInput] = useState("");
    const [stateOfButton, setStateOfButton] = useState(-1);
    const navigate = useNavigate();
    // main message function 

    async function handleUserPrompt() {
        console.log(mainInput, "is here")
        localStorage.setItem("userPrompt", mainInput);
        navigate("/c");
    }
    return (
        <div className="w-full h-full ">
          {/* <div className="flex justify-center items-center w-full p-10">
          <TradingVolumeSlider/>
          </div> */}
            {/* top section  */}
            <div
                className="w-full min-h-[50vh] bg-cover bg-center px-14 py-10 gap-0 flex flex-col justify-start"
                style={{ backgroundImage: "url('/assets/images/dashBG.jpg')" }}
            >
                {/* content */}

                <p className=" text-left
                font-bold text-4xl -mb-4 bg-gradient-to-r from-orange to-lightOrange bg-clip-text text-transparent">
                    Hello There!
                </p>

                <div className="flex items-center gap-2 -mb-2">
                    <p className="text-left text-4xl font-black">Ask Matey About Your Latest DIY Plan!</p>

                    <MateyExpression expression="tool" />
                </div>

                <p className="text-left text-md text-slate-600 font-semibold">Share your DIY project ideas with Matey for expert advice!</p>



                {/* input */}
                <div className="w-full flex gap-0 border-2 bg-white border-lightOrange mt-6 rounded-lg flex-col">
                    <textarea
                        value={mainInput}
                        onChange={(e) => setMainInput(e.target.value)}
                        placeholder="Give Your Idea To Matey."
                        className="w-full rounded-t-lg rounded-b-none pr-12 outline-none focus:outline-none focus:ring-0 placeholder-slate-900 text-slate-900 transition-all duration-1000 ease-in-out"
                        rows={3}
                        style={{ transition: "height 0.3s ease-in-out" }}
                    />
                    <div className="p-2 h-12 border-t-2 border-lightOrange justify-between items-center w-full flex space-x-2">
                        <div className="flex gap-4 items-center">

                            <button
                                onClick={handleUserPrompt}
                                disabled={stateOfButton === 0 ? true : false}
                                className="bg-orange rounded-md p-2 hover:bg-lightOrange hover:shadow-md hover:shadow-light"
                            >
                                {stateOfButton === -1 ? (
                                    <Send size={18} />
                                ) : stateOfButton === 0 ? (
                                    <LoaderPinwheel className="animate-spin" />
                                ) : (
                                    <div className="w-1 h-1 bg-slate-500 rounded-sm"></div>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>



        </div>
    );
}
