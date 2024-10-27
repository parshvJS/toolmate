import SocketProvider from "@/context/socketContext";
import classNames from "classnames";
import { Columns2 } from "lucide-react";
import { useState } from "react";
import { Outlet } from "react-router-dom";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Toolbar } from "@/components/custom/Toolbar";
import { ToolSpread } from "@/components/custom/ToolSpread";
export function SocketLayout() {
    const [collapsed, setSidebarCollapsed] = useState(false);

    const toggleSidebar = () => {
        console.log("Toggling sidebar"); // Debug log
        setSidebarCollapsed(prevState => !prevState);
    };

    return (
        <SocketProvider>
            {/* <div className="grid grid-cols-[1fr_auto] h-screen"> */}
            {/* Main Content */}
            <div className="flex-grow relative w-full">
                <div className="w-full flex">
                    <div className="w-2/3 p-0">

                        <Outlet />

                    </div>
                    <div className={`${collapsed ? "w-1/3" : "w-1/4"}`}>
                        <ToolSpread />
                    </div>
                </div>

            </div>
            {/* Right Sidebar */}
            {/* <div
                    className={classNames("transition-all duration-300 ease-in-out overflow-hidden", {
                        "w-[64px]": collapsed,  // Collapsed width
                        "w-[380px]": !collapsed  // Expanded width
                    })}
                >
                    <Toolbar
                        collapsed={collapsed}
                        setCollapsed={setSidebarCollapsed}
                    />
                </div> */}
            {/* </div> */}
        </SocketProvider>
    );
}

