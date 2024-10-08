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
export function SocketLayout() {
    const [collapsed, setSidebarCollapsed] = useState(false);

    const toggleSidebar = () => {
        console.log("Toggling sidebar"); // Debug log
        setSidebarCollapsed(prevState => !prevState);
    };

    return (
        <SocketProvider>
            <div className="grid grid-cols-[1fr_auto] h-screen">
                {/* Main Content */}
                <div className="flex-grow relative">

                    <button
                        className="absolute top-1 right-1 z-50"
                        onClick={toggleSidebar}
                    >
                        <TooltipProvider>
                            <Tooltip delayDuration={90}>
                                <TooltipTrigger>
                                    <div className="p-1 text-white bg-yellow hover:bg-yellow/90 hover:backdrop-blur-md rounded-md">
                                        <Columns2 />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="left">
                                    <p>{collapsed ? "Open Toolbar " : "Close Toolbar"}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </button>

                    <div>
                        <Outlet />
                    </div>
                </div>

                {/* Right Sidebar */}
                <div
                    className={classNames("transition-all duration-300 ease-in-out overflow-hidden", {
                        "w-[64px]": collapsed,  // Collapsed width
                        "w-[390px]": !collapsed  // Expanded width
                    })}
                >
                    <Toolbar
                        collapsed={collapsed}
                        setCollapsed={setSidebarCollapsed}
                    />
                </div>
            </div>
        </SocketProvider>
    );
}

