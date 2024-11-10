import { RightSidebarContext } from "@/context/rightSidebarContext"
import { Grid2x2Plus, ListPlus, Plus, ReceiptText, Scan, Shapes, SquareDashedBottom, SquarePlus } from "lucide-react"
import { useContext, useState } from "react"
import { motion } from "framer-motion"
import { Separator } from "../ui/separator"
import MateyExpression from "./MateyExpression"
import CustomSlider from "@/components/custom/Slider"
import { Switch } from "@/components/ui/switch"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import BunningProduct from "./BunningProduct"

const productSuggestionsTabs = [
    {
        img: "/assets/icons/new-placeholder.svg",
        name: "bunnings",
        tooltip: "Bunnings Product Suggestion",
    },
    {
        img: "/assets/icons/ai-placeholder.svg",
        name: "ai",
        tooltip: "Product Suggestion By Matey",
    },
    {
        img: "/assets/icons/vendor-placeholder.svg",
        name: "vendor",
        tooltip: "Vendor Product Suggestion",
    }
]
export default function Notify({ index }: {
    index: number
}) {
    return (
        // notify
        <div className="absolute z-50 -top-2 -right-2 w-6 h-6 flex items-center justify-center text-white font-semibold rounded-full bg-red-400 animate-pulse shadow-lg shadow-red-500/70">
            {index.toString()}
        </div>
    )
}
export function ToolSpread() {
    const { isSliderBreakPointEmpty, setIsBudgetOn, isBudgetOn, totalProductSuggestions, aiProduct, vendorProduct, bunningProduct } = useContext(RightSidebarContext)
    const [currOpenIndex, setCurrOpenIndex] = useState<number>(-1)
    const [currActiveTab, setCurrActiveTab] = useState<string>("bunnings")
    const [currActiveProductId, setCurrActiveProductId] = useState<string>("")
    function handleElementClick(index: number) {
        if (currOpenIndex === index) {
            setCurrOpenIndex(-1)
            return
        }
        setCurrOpenIndex(index)
    }

    return (
        <>
            {/* budget slider suggestion */}
            <div className="w-full p-2 flex-col flex gap-2">
                {/*  lable */}
                <div className="border-softYellow shadow-md border rounded-md p-4">

                    <div className="flex rounded-lg mb-2 gap-2 flex-col">
                        <div className="flex items-center gap-2 justify-between">
                            <div className="flex gap-2 items-center">
                                <img src="/assets/icons/Tick.svg" alt="" className="w-5 h-5" />
                                <p className="font-semibold ">Budget Selection</p>

                            </div>
                            <div className="flex gap-2 items-center font-semibold ">
                                <p >Apply Budget</p>
                                <Switch
                                    checked={isBudgetOn}
                                    onCheckedChange={(value) => setIsBudgetOn(value)}
                                    className="data-[state=checked]:bg-lightOrange data-[state=unchecked]:bg-slate-400" />
                            </div>


                        </div>
                        <Separator className="border border-slate-700" />
                    </div>
                    <div className={`${isSliderBreakPointEmpty ? "block" : "hidden"} my-2 rounded-lg`}>
                        <div className="w-full h-32 bg-paleYellow flex flex-col gap-2 items-center rounded-lg">
                            <MateyExpression expression="laugh" />
                            <p className=" w-3/4">Keep Chating ! Matey Will Create personalized Budget Slider So !</p>
                        </div>
                    </div>

                    <div className={`${isSliderBreakPointEmpty ? "hidden" : "block"} `}>
                        <CustomSlider />
                    </div>
                </div>
                {/*  lable */}
                <div className="border-softYellow shadow-md border rounded-md p-4">
                    <div className="flex rounded-lg mb-2 gap-2 flex-col">
                        <div className="flex items-center gap-2">
                            <img src="/assets/icons/Tick.svg" alt="" className="w-5 h-5" />
                            <p className="font-semibold ">Material And Product Suggestion</p>
                        </div>
                        <Separator className="border border-slate-700" />
                    </div>


                    {/*  catagory */}
                    <Dialog>
                        <DialogTrigger className="w-full h-full">
                            <div className="-m-2 my-2  ">

                                <div className="flex border-2 border-softYellow relative gap-2 items-center bg-whiteYellow  px-2 py-1 text-left hover:bg-paleYellow transition-all duration-150 cursor-pointer rounded-md ml-2 mt-2">
                                    <img
                                        src="/assets/icons/prod-placeholder.svg"
                                        alt="bunnings"
                                        className="w-16 h-16 rounded-md shadow-xl"
                                    />
                                    <div>
                                        <p className="font-semibold">Click To View Suggestions</p>
                                        <p className="text-slate-500">{totalProductSuggestions} suggestion </p>
                                    </div>
                                </div>
                            </div>
                        </DialogTrigger>
                        <DialogContent className="h-[calc(100%-10rem)] lg:max-w-screen-xl max-w-screen-lg md:max-w-screen-md sm:max-w-screen-sm p-0 overflow-hidden">
                            <div className="flex">
                                <div className="flex flex-col gap-2 border-r-2 border-yellow p-2 sticky">
                                    {
                                        productSuggestionsTabs.map((product, index) => {
                                            return (
                                                <TooltipProvider>
                                                    <Tooltip delayDuration={0}>
                                                        <TooltipTrigger>
                                                            <div
                                                                onClick={() => setCurrActiveTab(product.name)}
                                                                key={index} className="flex gap-2 items-center rounded-md cursor-pointer hover:bg-mangoYellow transition-all duration-200">
                                                                <img
                                                                    src={product.img}
                                                                    alt={product.name}
                                                                    className="w-12 h-12 rounded-md shadow-xl"
                                                                />
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="right" className="bg-mangoYellow z-50">
                                                            <p>{product.tooltip}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )
                                        })
                                    }

                                </div>


                                <div className="flex-1 h-full overflow-hidden">
                                    {HeadingName(currActiveTab)}
                                    <hr className="border border-lightYellow mt-2" />
                                    <div className="flex h-full w-full">
                                        <ScrollArea type="scroll" className="w-3/4 md:h-[550px] hide-scrollbar overflow-scroll">
                                            {/* bunning product */}
                                            {currActiveTab === "bunnings" && <BunningProduct activeValue={currActiveProductId} setActiveValue={setCurrActiveProductId} />}
                                        </ScrollArea>
                                        <div className="w-1/4 p-4 border-l-2 border-yellow h-full flex flex-col items-center justify-center">
                                            <img src="/assets/icons/empty-placeholder.svg" alt="empty-placeholder" className="w-72 h-72" />
                                            <p className="text-center">Select Product To View Details Of Item</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>





                    {/* product */}
                </div>

                {/* <div className={`${productSuggestions.length == 0 ? "flex" : "hidden"} my-2 rounded-lg`}>
                    <div className="w-full h-32 bg-paleYellow flex flex-col gap-2 items-center rounded-lg">
                        <MateyExpression expression="1thumb" />
                        <p className=" w-3/4">Keep Chatting Matey Will Add Materials And Products Here!</p>
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <div className={`${productSuggestions.length == 0 ? "hidden" : "flex gap-2 justify-between"} p-2 cursor-pointer rounded-md w-full bg-lightYellow hover:bg-yellow transition-all border-2 border-yellow `}>
                        <div className="flex gap-2">
                            <Shapes className="w-6 h-6" />
                            <p className="font-semibold">Your Collection</p>
                        </div>
                        <div>
                            <ListPlus />
                        </div>
                    </div>
                    {
                        productSuggestions.map((product, index) => {
                            return (
                                <div key={index}>
                                    <div className={`${currOpenIndex == index ? "bg-paleYellow" : ""} w-full border hover:bg-paleYellow cursor-pointer border-lightYellow flex justify-between p-3 rounded-md`} onClick={() => handleElementClick(index)}>
                                        <div className="flex gap-2 items-center">
                                            <SquareDashedBottom className="w-5 h-5" />
                                            <p className="font-semibold text-slate-700">{product.name}</p>
                                        </div>
                                        <Plus className="w-5 h-5 text-slate-500" />
                                    </div>
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: currOpenIndex === index ? "auto" : 0, opacity: currOpenIndex === index ? 1 : 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="overflow-hidden"
                                    >
                                        <div className=" mt-2 flex-col flex gap-2 rounded-md">
                                            {
                                                product.data.length > 4 ? product.data.slice(0, 3).map((item, itemIndex) => {
                                                    return (
                                                        <div key={itemIndex} className="flex gap-2 shadow-md">
                                                            <img src={item.image} alt="" className="rounded-md" />
                                                        </div>
                                                    )
                                                }) : (

                                                    product.data.map((item, itemIndex) => {
                                                        return (
                                                            <div key={itemIndex} className="flex justify-between bg-paleYellow  hover:bg-mangoYellow transition-all duration-200 p-2 rounded-lg cursor-pointer gap-2 w-full border-2 border-yellow">
                                                                <div className="flex flex-col h-full flex-1 justify-between  gap-1 w-3/5 items-start">
                                                                    <p className="font-bold capitalize">{item.title.length > 25 ? item.title.slice(0, 23) + "..." : item.title}</p>
                                                                    <p className="text-slate-700 font-semibold">{item.price} $</p>
                                                                </div>

                                                                <div className="w-1/3">
                                                                    <img src={item.image} alt="" className="rounded-md w-full h-20" />
                                                                </div>
                                                            </div>
                                                        )
                                                    })
                                                )
                                            }
                                            {
                                                product.data.length > 4 &&
                                                <div className="flex gap-2 w-full flex-col ">
                                                    <div>
                                                        <ReceiptText />
                                                    </div>
                                                    <p className="text-slate-500">+{product.data.length - 3} more</p>
                                                </div>
                                            }
                                        </div>
                                    </motion.div>
                                </div>
                            )
                        })
                    }
                </div> */}
            </div>
        </>
    )
}

const HeadingName = (currState: string) => {
    switch (currState) {
        case "bunnings":
            return <div className="flex flex-col text-left px-4 py-1">
                <p className="font-semibold text-left text-xl">Bunnings Product Suggestion</p>
                <p>Matey Have picked this Products From Bunnings</p>
            </div>
        case "ai":
            return <div className="flex flex-col text-left px-4 py-1">
                <p className="font-semibold text-left text-xl">Matey's Product Suggestions</p>
                <p>Matey Have Created This Product</p>
            </div>
        case "vendor":
            return <div className="flex flex-col text-left px-4 py-1">
                <p className="font-semibold text-left text-xl">Vendor Product Suggestions</p>
                <p>Matey Have Picked This Products From Vendors Listed On Toolmate</p>
            </div>
    }
}
