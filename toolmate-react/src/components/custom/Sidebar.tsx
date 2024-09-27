import { Separator } from "@radix-ui/react-dropdown-menu";
import Logo from "./Logo";
import GetProSection from "./GetProSection";

export default function Sidebar() {

    const navItem = [
        {
            icon: "/public/assets/matey-emoji/tool.svg",
            title: "New Chat",
            href: "/chat?new=true"
        },
    ]


    return (
        <div className="bg-whiteYellow w-1/5 border-r-2 border-slate-300 px-5 py-7">
            {/* logo */}
            <div>
                <Logo />
            </div>

            <hr className="border border-l-stone-300 my-2" />

            {/* get pro section */}
            <div>
                <GetProSection />
            </div>




        </div>
    )
}