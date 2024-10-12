import React, { useContext, useState, useEffect } from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { ToolbarLabel } from "./ToolbarLabel";
import { Tag } from "lucide-react";
import { RightSidebarContext } from "@/context/rightSidebarContext";
import MateyExpression from "./MateyExpression";


export default function TradingVolumeSlider() {
    const {
        sliderValue,
        setSliderValue,
        breakpoints,
        isSliderBreakPointEmpty,
    } = useContext(RightSidebarContext);

    const [value, setValue] = useState([sliderValue]);
    const [showTooltip, setShowTooltip] = useState(false);
    const [min, setMin] = useState(Infinity);
    const [max, setMax] = useState(0);

    useEffect(() => {
        setMin(breakpoints.reduce((acc, curr) => {
            if (acc > curr.value) {
                acc = curr.value;
            }
            return acc; // Ensure acc is returned here
        }
            , Infinity));

        setMax(breakpoints.reduce((acc, curr) => {
            if (acc < curr.value) {
                acc = curr.value;
            }
            return acc; // Ensure acc is returned here
        }
            , 0));
    }, [breakpoints])
    const getCurrentTooltip = () => {
        const currentValue = value[0];
        for (let i = breakpoints.length - 1; i >= 0; i--) {
            if (currentValue >= breakpoints[i].value) {
                return {
                    label: breakpoints[i].label,
                    tooltip: breakpoints[i].tooltip,
                };
            }
        }
        return {
            label: "",
            tooltip: "",
        };
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = Math.min(
            Math.max(parseInt(e.target.value) || 0, min),
            max
        ); // Enforce min and max
        setValue([newValue]);
        setSliderValue(newValue); // Update the context value
    };

    if (isSliderBreakPointEmpty) {
        return <div className="flex justify-center items-center flex-col gap-4 my-10">
            <MateyExpression expression="1thumb" />
            <p className=" font-semibold">Keep Chating Matey Will Create Personalized Budget Slider For You Soon.</p>
        </div>
    }

    return (
        <div className="w-full ">
            <div>
                <ToolbarLabel name="Customize Your Budget" icon={<Tag />} />
            </div>
            <div className="relative pt-1 mt-5">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: showTooltip ? 1 : 0, scale: showTooltip ? 1 : 0.9 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="w-full bg-lightYellow border-2 border-black shadow-lg rounded-lg text-left text-md font-semibold text-black"
                >
                    <div className="p-2">{getCurrentTooltip().label}</div>

                    <hr className="border border-black w-full" />

                    <div className="p-2 font-medium">{getCurrentTooltip().tooltip}</div>
                </motion.div>

                <div className="flex items-center gap-4 mb-4 mt-5">
                    <SliderPrimitive.Root
                        className="relative mr-1 flex items-center select-none touch-none w-full h-5"
                        value={value}
                        onValueChange={(newValue) =>
                            setValue([Math.max(min, Math.min(newValue[0], max))])
                        } // Enforce min and max
                        min={min}
                        max={max}
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                    >
                        <SliderPrimitive.Track className="bg-slate-700 relative grow rounded-full h-2">
                            <SliderPrimitive.Range className="absolute bg-yellow-500 rounded-full h-full" />
                        </SliderPrimitive.Track>

                        {breakpoints.map((breakpoint, index) => (
                            <React.Fragment key={index}>
                                <div
                                    className="absolute h-4 w-1 rounded-full bg-black"
                                    style={{
                                        left: `${((breakpoint.value - min) / (max - min)) * 100}%`,
                                    }} // Adjust for min
                                />
                                <div
                                    className={`absolute text-xs font-semibold bottom-[-1.5rem] transform -translate-x-1/2 text-black top-7`}
                                    style={{
                                        left: `${((breakpoint.value - min) / (max - min)) * 100}%`,
                                    }} // Adjust for min
                                >
                                    {breakpoint.value}
                                </div>
                            </React.Fragment>
                        ))}

                        <SliderPrimitive.Thumb className="block w-5 h-5 bg-black border-2 border-yellow-500 rounded-full shadow-lg focus:outline-none" />
                    </SliderPrimitive.Root>
                </div>

                <div className="mt-5">
                    <Input
                        type="number"
                        placeholder={`$${min} - $${max}`} // Update placeholder to reflect min and max
                        value={value[0]}
                        onChange={handleInputChange}
                        className="border-2 border-black w-full pl-6 mt-10"
                    />
                </div>
            </div>
        </div>
    );
}
