import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

const breakpoints = [
    { value: 0, label: "Entry-Level DIY", tooltip: "Entry-Level DIY (e.g., Ozito, Aldi's Workzone)" },
    { value: 33, label: "Mid-Range DIY", tooltip: "Mid-Range DIY (e.g., Ryobi, Bosch Green)" },
    { value: 66, label: "High-End DIY/Low-End Trade", tooltip: "High-End DIY/Low-End Trade (e.g., Makita DIY line)" },
    { value: 100, label: "Trade Quality", tooltip: "Trade Quality (e.g., DeWalt, Milwaukee M18)" },
]

export default function TradingVolumeSlider() {
    const [value, setValue] = React.useState([33])
    const [showTooltip, setShowTooltip] = React.useState(false)

    const getCurrentTooltip = () => {
        const currentValue = value[0]
        for (let i = breakpoints.length - 1; i >= 0; i--) {
            if (currentValue >= breakpoints[i].value) {
                return breakpoints[i].tooltip
            }
        }
        return ""
    }

    return (
        <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-md">
            <h2 className="text-2xl font-semibold mb-2">Select Your Maximum Budget</h2>
            <p className="text-gray-600 mb-4">
                Set your maximum budget to find tool recommendations that fit your project needs.
            </p>
            <div className="relative pt-1">
                <SliderPrimitive.Root
                    className="relative flex items-center select-none touch-none w-full h-5"
                    value={value}
                    onValueChange={setValue}
                    max={100}
                    step={1}
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                >
                    <SliderPrimitive.Track className="bg-paleYellow relative grow rounded-full h-2">
                        <SliderPrimitive.Range className="absolute bg-softYellow rounded-full h-full" />
                    </SliderPrimitive.Track>

                    {/* Breakpoints and visual quality indicators */}
                    {breakpoints.map((breakpoint, index) => (
                        <React.Fragment key={index}>
                            <div
                                className="absolute h-3 w-3 rounded-full bg-yellow"
                                style={{ left: `${breakpoint.value}%` }}
                            />
                            <div
                                className={`absolute bottom-6 left-${breakpoint.value}% transform -translate-x-1/2 bg-white shadow-lg px-2 py-1 rounded text-md font-semibold text-black`}
                                style={{
                                    left: `${breakpoint.value}%`,
                                    opacity: value[0] === breakpoint.value ? 1 : 0,
                                    transition: "opacity 0.3s ease",
                                }}
                            >
                                {breakpoint.label}
                            </div>
                        </React.Fragment>
                    ))}

                    <SliderPrimitive.Thumb className="block w-5 h-5 bg-slate-200 border-2 border-yellow-500 rounded-full shadow-lg focus:outline-none">
                        {showTooltip && (
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 w-[160px] bg-yellow text-white text-md rounded">
                                {getCurrentTooltip()}
                            </div>
                        )}
                    </SliderPrimitive.Thumb>
                </SliderPrimitive.Root>

                {/* Dynamic Upgrade Teaser */}
                <div className="flex justify-between mt-4">
                    <span className="text-md font-medium text-gray-700">
                        Unlock advanced recommendations with <strong>ToolMate Pro</strong>
                    </span>
                </div>
            </div>
        </div>
    )
}
