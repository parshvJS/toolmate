import LoadingPage from "@/components/custom/LoadingPage";
import Sidebar from "@/components/custom/Sidebar";
import { useAuth, UserButton } from "@clerk/clerk-react";
import classNames from "classnames";
import { Columns2 } from "lucide-react";
import { useContext, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import ErrorPage from "@/components/custom/ErrorPage";
import { UserContext } from '@/context/userContext';
import { RightSidebarProvider } from "@/context/rightSidebarContext";

export default function DashboardLayout() {
    const { isLoading, isError } = useContext(UserContext);
    const { isLoaded, userId } = useAuth();
    const [collapsed, setSidebarCollapsed] = useState(false);
    const navigator = useNavigate();

    if (!isLoaded) {
        return <LoadingPage title="Preparing Dashboard..." />;
    }

    if (!userId) {
        navigator("/signin");
        return null;
    }

    if (isLoading) {
        return <LoadingPage title="Waking Up Matey..." />;
    }

    if (isError) {
        return <ErrorPage title="Something went wrong while fetching user data." />;
    }

    return (
        <RightSidebarProvider>
            <div
                className={classNames(
                    "grid min-h-screen scrollbar-hide",
                    {
                        "grid-cols-main-sidebar": !collapsed,
                        "grid-cols-main-sidebar-collapsed": collapsed,
                        "transition-[grid-template-columns] duration-300 ease-in-out": true,
                    }
                )}
            >
                {/* Sidebar */}
                <Sidebar collabsable={collapsed}
                    setCollabsable={setSidebarCollapsed}

                />



                {/* Collapse button */}
                <div className="relative w-full h-full">
                    <div>
                        <button
                            className="absolute top-1 left-1 z-50"
                            onClick={() => setSidebarCollapsed(!collapsed)}
                        >
                            <TooltipProvider>
                                <Tooltip delayDuration={90}>
                                    <TooltipTrigger>
                                        <div className="p-1 text-white bg-yellow hover:bg-yellow/90 hover:backdrop-blur-md rounded-md">
                                            <Columns2 />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="right">
                                        <p>{collapsed ? "Open Sidebar " : "Close Sidebar"}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </button>


                    </div>

                    {/* Main content */}
                    <div className="scrollbar-hide">
                        <Outlet />
                    </div>
                </div>
            </div>
        </RightSidebarProvider>
    );
}
