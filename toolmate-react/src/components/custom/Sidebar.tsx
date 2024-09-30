import { Separator } from "@radix-ui/react-dropdown-menu";
import Logo from "./Logo";
import GetProSection from "./GetProSection";
import DarkLogo from "./DarkLogo";
import LogoSmall from "./LogoSmall";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

export default function Sidebar({
    collabsable = false
}: {
    collabsable?: boolean
}) {

    const navItem = [
        {
            icon: "/public/assets/icons/communityNavIcon.svg",
            title: "Explore Community",
            href: "/community"
        },
        {
            icon: "/public/assets/icons/userCommunityNavIcon.svg",
            title: "My Community",
            href: "/my-community"
        }
    ]


    return (
        <div className={`${collabsable ? "px-1" : "px-3"} bg-whiteYellow border-r-2 border-slate-300 `}>
            {/* logo */}
            <div>
                <div className={`flex mt-5 items-center ${collabsable ? "justify-center" : "justify-start"} `}>
                    {!collabsable ? <DarkLogo /> : <LogoSmall />}
                </div>

            </div>

            <hr className="border border-l-stone-300 my-2" />

            {/* get pro section */}
            {/* <div>
                <GetProSection />
            </div> */}

            {/* nav item */}

            {/* new chat  */}
            {/* collabsed */}
            <TooltipProvider >
                <Tooltip delayDuration={70}>
                    <TooltipTrigger className={`${collabsable ? "block" : "hidden"} `}>
                        <img src="/public/assets/matey-emoji/tool.svg" alt="new chat" className={` p-1 bg-mangoYellow hover:bg-softYellow rounded-lg w-14 h-14 cursor-pointer`} />

                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-paleYellow">
                        <p>Create New Chat</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>



            {/* not collabsed */}
            <div className={`${collabsable ? "hidden" : "flex"} px-3 items-center gap-3 hover:bg-softYellow cursor-pointer rounded-lg bg-mangoYellow transition duration-300 ease-in-out`}>
                <img src="/public/assets/matey-emoji/tool.svg" alt="new chat" className="w-12 h-12" />
                <p className="font-semibold">New Chat</p>
            </div>

            <hr className="border border-l-stone-300 my-2" />

            {/* all nav item */}
            <div className={`${collabsable ? "hidden" : "flex"} flex-col`}>
                {navItem.map((item, index) => {
                    return (
                        <div key={index} className="flex items-center  gap-2 py-2 px-4 hover:bg-softYellow cursor-pointer rounded-lg">
                            <img src={item.icon} alt={item.title} className="w-8 h-8" />
                            <p className="font-semibold text-sm">{item.title}</p>
                        </div>
                    )
                })}
            </div>

            {/* mobile nav */}
            <div className={`${collabsable ? "flex" : "hidden"} flex-col gap-2`}>
                {navItem.map((item, index) => {
                    return <TooltipProvider>
                        <Tooltip delayDuration={70}>
                            <TooltipTrigger>
                                <div className="flex items-center p-1  justify-center hover:bg-softYellow cursor-pointer rounded-lg">
                                    <img src={item.icon} alt={item.title} className="w-8 h-8" />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="bg-paleYellow">
                                <p>{item.title}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                })}
            </div>

        </div>
    )
}