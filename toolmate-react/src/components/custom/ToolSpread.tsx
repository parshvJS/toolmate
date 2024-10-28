import { RightSidebarContext } from "@/context/rightSidebarContext"
import { ListPlus, Plus, ReceiptText, Scan, Shapes, SquareDashedBottom } from "lucide-react"
import { useContext, useState } from "react"
import { motion } from "framer-motion"
import { Separator } from "../ui/separator"
import MateyExpression from "./MateyExpression"
import CustomSlider  from "@/components/custom/Slider"

export function ToolSpread() {
    const { productSuggestions, isSliderBreakPointEmpty } = useContext(RightSidebarContext)
    const [currOpenIndex, setCurrOpenIndex] = useState<number>(-1)


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
                <div className="flex rounded-lg mb-2 gap-2 flex-col">
                    <div className="flex items-center gap-2">
                        <img src="/assets/icons/Tick.svg" alt="" className="w-5 h-5" />
                        <p className="font-semibold ">Budget Selection</p>
                    </div>
                    <Separator className="border border-slate-700" />
                </div>
                <div className={`${isSliderBreakPointEmpty ? "block" : "hidden"} my-2 rounded-lg`}>
                    <div className="w-full h-32 bg-paleYellow flex flex-col gap-2 items-center rounded-lg">
                        <MateyExpression expression="laugh" />
                        <p className=" w-3/4">Keep Chating ! Matey Will Create personalized Budget Slider So !</p>
                    </div>
                </div>

                <div className={`${isSliderBreakPointEmpty ? "hidden":"block"}`}>
                    <CustomSlider />
                </div>
                {/*  lable */}
                <div className="flex rounded-lg mb-2 gap-2 flex-col">
                    <div className="flex items-center gap-2">
                        <img src="/assets/icons/Tick.svg" alt="" className="w-5 h-5" />
                        <p className="font-semibold ">Material And Product Suggestion</p>
                    </div>
                    <Separator className="border border-slate-700" />
                </div>

                <div className={`${productSuggestions.length == 0 ? "flex" : "hidden"} my-2 rounded-lg`}>
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
                                                                {/* /content */}
                                                                <div className="flex flex-col h-full flex-1 justify-between  gap-1 w-3/5 items-start">
                                                                    <p className="font-bold capitalize">{item.title.length > 25 ? item.title.slice(0, 23) + "..." : item.title}</p>
                                                                    <p className="text-slate-700 font-semibold">{item.price} $</p>
                                                                </div>

                                                                {/* image */}
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
                </div>
            </div>
        </>
    )
}