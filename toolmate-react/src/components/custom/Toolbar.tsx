
import { Lightbulb, } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToolbarLabel } from "./ToolbarLabel";
import { ToolbarMateyExp } from "./ToolbarMateyExp";
import CustomSlider from "./Slider";
import { ProductSuggestion } from "./productSuggestion";


export function Toolbar({ collapsed, setCollapsed }: { collapsed: boolean, setCollapsed: React.Dispatch<React.SetStateAction<boolean>> }) {


    return (
        <div className="border-l-2 border-slate-300 h-screen"> {/* Use h-screen to take the full viewport height */}
            {
                collapsed ? (
                    <div className="h-full">
                        {/* Content for collapsed state */}
                    </div>
                ) : (
                    <div className="h-full flex flex-col">
                        {/* Ensure each child takes up 50% of the height */}
                        <div className="flex-1 h-[40%]">
                            <Tabs defaultValue="tool" className="p-4 h-full">
                                <TabsList className="w-full bg-slate-200">
                                    <TabsTrigger value="tool" className="data-[state=active]:bg-yellow w-1/2 my-2">Tool Suggestion</TabsTrigger>
                                    <TabsTrigger value="price" className="data-[state=active]:bg-yellow w-1/2">Set Project Budget</TabsTrigger>
                                </TabsList>
                                <TabsContent value="tool" className="h-full">
                                    <ProductSuggestion />
                                </TabsContent>
                                <TabsContent value="price">
                                    <CustomSlider />
                                </TabsContent>
                            </Tabs>
                        </div>
                        <div className="flex-1 p-4"> {/* This also takes up the remaining 50% */}
                            <ToolbarLabel
                                icon={<Lightbulb />}
                                name="Matey"
                            />

                            <ToolbarMateyExp
                                expression="confident"
                            />
                        </div>
                    </div>
                )
            }
        </div>
    );
}
