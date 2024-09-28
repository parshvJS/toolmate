import LoadingPage from "@/components/custom/LoadingPage"
import Sidebar from "@/components/custom/Sidebar"
import { useAuth } from "@clerk/clerk-react"
import classNames from "classnames"
import { Columns2 } from "lucide-react"
import { useState } from "react"
import { Outlet, useNavigate } from "react-router-dom"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

export default function DashboardLayout() {
    const { isLoaded, userId, sessionId } = useAuth();
    const [collapsed, setSidebarCollapsed] = useState(false);

    const navigator = useNavigate();
    if (!isLoaded) {
        return <LoadingPage title="Preparing Dashboard..." />;
    }
    if (!userId && isLoaded) {
        navigator("/signin");
    }

    return (
        <div
            className={classNames(
                "grid min-h-screen w-screen h-screen overflow-hidden", // Add overflow-hidden to remove scrollbars
                {
                    "grid-cols-sidebar": !collapsed,
                    "grid-cols-sidebar-collapsed": collapsed,
                    "transition-[grid-template-columns] duration-300 ease-in-out": true,
                }
            )}
        >
            <Sidebar collabsable={collapsed} />

            <div className="flex justify-start items-start w-full h-full overflow-hidden"> {/* Add overflow-hidden here too */}
                <button onClick={() => setSidebarCollapsed(!collapsed)}>
                    <TooltipProvider>
                        <Tooltip delayDuration={90}>
                            <TooltipTrigger>
                                <div className="z-50 p-2 m-1 hover:bg-slate-200 rounded-md bg-slate-200">
                                    <Columns2 />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                                <p>{collapsed ? "Open Sidebar " : "Close Sidebar"}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </button>
                <Outlet />
            </div>
        </div>
    );
}
