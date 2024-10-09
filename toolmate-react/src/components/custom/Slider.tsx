import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

const breakpoints = [
    { value: 0, label: "Entry-Level DIY", tooltip: "Entry-Level DIY (e.g., Ozito, Aldi's Workzone)" },
    { value: 3300, label: "Mid-Range DIY", tooltip: "Mid-Range DIY (e.g., Ryobi, Bosch Green)" },
    { value: 6600, label: "High-End DIY/Low-End Trade", tooltip: "High-End DIY/Low-End Trade (e.g., Makita DIY line)" },
    { value: 10000, label: "Trade Quality", tooltip: "Trade Quality (e.g., DeWalt, Milwaukee M18)" },
]

export default function TradingVolumeSlider() {
    const [value, setValue] = React.useState([3300])
    const [showTooltip, setShowTooltip] = React.useState(false)
    const [applyBudget, setApplyBudget] = React.useState(false)

    const getCurrentTooltip = () => {
        const currentValue = value[0]
        for (let i = breakpoints.length - 1; i >= 0; i--) {
            if (currentValue >= breakpoints[i].value) {
                return breakpoints[i].tooltip
            }
        }
        return ""
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = Math.min(Math.max(parseInt(e.target.value) || 0, 0), 10000)
        setValue([newValue])
    }

    return (
        <div className="w-full max-w-md p-6 bg-lightYellow rounded-xl shadow-md border-2 border-black">
            <h2 className="text-xl font-semibold mb-2 text-left">Select Your Maximum Budget</h2>
            <p className="text-[3px] text-gray-600 mb-4 text-left">
                Budget for New Tool Suggestions
            </p>
            <div className="relative pt-1">

                <div className="flex items-center gap-4 mb-4">
                    <SliderPrimitive.Root
                        className="relative flex items-center select-none touch-none w-full h-5"
                        value={value}
                        onValueChange={setValue}
                        max={10000}
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                    >
                        <SliderPrimitive.Track className="bg-slate-700 relative grow rounded-full h-2">
                            <SliderPrimitive.Range className="absolute bg-slate-700 w rounded-full h-full" />
                        </SliderPrimitive.Track>

                        {breakpoints.map((breakpoint, index) => (
                            <React.Fragment key={index}>
                                <div
                                    className="absolute h-5 w-1 rounded-full bg-black"
                                    style={{ left: `${(breakpoint.value / 10000) * 100}%` }}
                                />
                                <div
                                    className={`absolute bottom-6 left-${(breakpoint.value / 10000) * 100}% transform -translate-x-1/2 bg-white shadow-lg px-2 py-1 rounded text-md font-semibold text-black`}
                                    style={{
                                        left: `${(breakpoint.value / 10000) * 100}%`,
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
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 w-[160px] bg-white text-black border-2 bg-black text-md rounded">
                                    {getCurrentTooltip()}
                                </div>
                            )}
                        </SliderPrimitive.Thumb>
                    </SliderPrimitive.Root>
                </div>
                <div className="flex items-center justify-between">
                    <div className="relative">
                        <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-black">$</span>
                        <Input
                            type="number"
                            value={value[0]}
                            onChange={handleInputChange}
                            className="border-2 border-black w-28 pl-6"
                            min={0}
                            max={10000}
                        />
                    </div>

                    <div className="flex items-center gap-2 ">
                        <Switch id="apply-budget" checked={applyBudget} onCheckedChange={setApplyBudget} />
                        <Label htmlFor="apply-budget" className="text-black">Apply Budget</Label>
                    </div>
                </div>


                {/* Dynamic Upgrade Teaser
        <div className="flex justify-between mt-4">
          <span className="text-md font-medium text-gray-700">
            Unlock advanced recommendations with <strong>ToolMate Pro</strong>
          </span>
        </div> */}
            </div>
        </div>
    )
}

