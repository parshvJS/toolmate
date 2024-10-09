import { Bolt, Target } from "lucide-react";
import TradingVolumeSlider from "./Slider";
import ToolSuggestion from "./ToolSuggestion";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import PrivateToolSugg from "./PrivateToolSugg";
export function Toolbar({ collapsed, setCollapsed }: { collapsed: boolean, setCollapsed: React.Dispatch<React.SetStateAction<boolean>> }) {
    return (
        <div className="flex flex-col h-full bg-whiteYellow  border-l-2 border-slate-300">

            <div className="flex-grow overflow-y-auto">
                <div className={`${collapsed ? "hidden" : "block"} p-2 flex flex-col gap-2`}>
                    <TradingVolumeSlider />
                    {/* <ToolSuggestion
                        isDropdownOpen={true}
                        defaultDropdownMessage="
                        -tool 1
                        -tool 1
                        -tool 1
                        -tool 1
                        -tool 1
                        -tool 1
                        -tool 1
                        -tool 1
                        -tool 1
                        -tool 1
                        -tool 1
                        -tool 1
                        -tool 1
                        -tool 1
                        -tool 1
                        -tool 1
                        -tool 1
                        -tool 1
                        -tool 1
                    "
                    /> */}

                    <PrivateToolSugg/>
                </div>

                <div className={`${collapsed ? "block" : "hidden"} flex flex-col gap-2 items-center justify-center py-3`}>
                    {/* Tooltip - Create New Chat */}
                    <TooltipProvider >
                        <Tooltip delayDuration={70}>
                            <TooltipTrigger className={`${collapsed ? "block" : "hidden"}`}>
                                {/* <img
                                    src="/assets/matey-emoji/tool.svg"
                                    alt="new chat"
                                    className="p-1 bg-lighterYellow hover:bg-softYellow rounded-lg w-14 h-14 cursor-pointer"
                                /> */}
                                <div onClick={() => setCollapsed(false)}>
                                    <Target className="p-4 bg-lighterYellow hover:bg-softYellow rounded-lg w-14 h-14 cursor-pointer" />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="bg-paleYellow">
                                <p>Tools Budget Selector</p>
                            </TooltipContent>
                        </Tooltip>

                    </TooltipProvider>
                    <TooltipProvider >
                        <Tooltip delayDuration={70}>
                            <TooltipTrigger className={`${collapsed ? "block" : "hidden"}`}>
                                {/* <img
                                    src="/assets/matey-emoji/tool.svg"
                                    alt="new chat"
                                    className="p-1 bg-lighterYellow hover:bg-softYellow rounded-lg w-14 h-14 cursor-pointer"
                                /> */}
                                <div onClick={() => setCollapsed(false)}>
                                    <Bolt className="p-4 bg-lighterYellow hover:bg-softYellow rounded-lg w-14 h-14 cursor-pointer" />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="bg-paleYellow">
                                <p>Tool Suggestions</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>

        </div>
    );
}