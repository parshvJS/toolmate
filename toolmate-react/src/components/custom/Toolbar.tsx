
import { Box, ChevronDown, ChevronUp, Lightbulb, Tag, } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToolbarMateyExp } from "./ToolbarMateyExp";
import CustomSlider from "./Slider";
import { useState } from "react";
import { ProductSuggestion } from "./ProductSuggestion";
import { Separator } from "@/components/ui/separator"
import { useSocket } from "@/context/socketContext";


export function Toolbar({ collapsed, setCollapsed }: { collapsed: boolean, setCollapsed: React.Dispatch<React.SetStateAction<boolean>> }) {
    const [isMateyOpen, setIsMateyOpen] = useState(false);
    const [isToolSuggestionOpen, setIsToolSuggestionOpen] = useState(true);
    const socket = useSocket();


    return (
        <div className="border-l-2 border-slate-300 h-screen"> {/* Use h-screen to take the full viewport height */}
            {
                collapsed ? (
                    <div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col">
                        {/* Ensure each child takes up 50% of the height */}
                        <div className={`${isMateyOpen ? "h-[60%]" : "flex-1"}`}>

                            <div className="m-1 flex gap-1">

                                <div
                                    onClick={() => {
                                        if (!isToolSuggestionOpen) {
                                            setIsToolSuggestionOpen(true);
                                        }
                                    }}
                                    className={`p-2 flex justify-center items-center  hover:bg-lightYellow cursor-pointer rounded-md transition-colors duration-300 ${isToolSuggestionOpen ? "bg-softYellow" : "bg-white"} `}>
                                    <Box />
                                </div>
                                <div
                                    onClick={() => {
                                        if (isToolSuggestionOpen) {
                                            setIsToolSuggestionOpen(false);
                                        }
                                    }}
                                    className={`p-2 flex justify-center items-center hover:bg-lightYellow cursor-pointer rounded-md transition-colors duration-300 ${!isToolSuggestionOpen ? "bg-softYellow" : "bg-white"} `}>
                                    <Tag />
                                </div>
                            </div>
                            {/* <Separator className="border border-slate-700" /> */}
                            <div>
                                {
                                    isToolSuggestionOpen ? <ProductSuggestion
                                        isMateyOpen={isMateyOpen}
                                    /> : <CustomSlider />
                                }
                            </div>

                        </div>
                        <div className={`px-2 pt-1 mb-5 ${isMateyOpen ? "flex-1" : ""}`}> {/* This also takes up the remaining 50% */}

                            <div className="flex justify-between py-2 px-2 bg-slate-200 rounded-md">
                                <div className="flex gap-2">
                                    <Lightbulb />
                                    <p className="font-semibold">Matey</p>
                                </div>

                                <div
                                    onClick={() => setIsMateyOpen(!isMateyOpen)}
                                    className="cursor-pointer"
                                >
                                    {isMateyOpen ? <ChevronUp /> : <ChevronDown />}
                                </div>

                            </div>
                            {
                                isMateyOpen && <ToolbarMateyExp
                                    expression="confident"
                                    isMateyOpen={isMateyOpen}
                                />
                            }
                        </div>
                    </div>
                )
            }
        </div>
    );
}
