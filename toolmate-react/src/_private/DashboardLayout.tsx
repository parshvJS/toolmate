import LoadingPage from "@/components/custom/LoadingPage"
import Sidebar from "@/components/custom/Sidebar"
import { useAuth } from "@clerk/clerk-react"
import classNames from "classnames"
import { Columns2 } from "lucide-react"
import { useContext, useEffect, useState } from "react"
import { Outlet, useNavigate } from "react-router-dom"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import ErrorPage from "@/components/custom/ErrorPage"
import axios from 'axios'
import { env } from "@/lib/environment"
import { UserContext } from '@/context/userContext'

export default function DashboardLayout() {
    const [isDataLoaded, setIsDataLoaded] = useState(false)
    const [isError, setIsError] = useState(false)
    const { isLoaded, userId, sessionId } = useAuth();
    const [collapsed, setSidebarCollapsed] = useState(false);

    // context for user data
    const { setData, setId } = useContext(UserContext)
    useEffect(() => {
        async function fetchPlanAccessAndStoreContext() {
            try {
                const data = await axios.post(`${env.domain}/api/v1/getUserPaidAndPersonalInfo`, {
                    clerkUserId: userId
                })

                if (!data.data) {
                    setIsError(true)
                }
                setData(data.data.data.planAccess)
                setId(data.data.data.id)
                setIsDataLoaded(true)

            } catch (error: any) {
                setIsError(true)
            }
        }

        if (isLoaded) {
            fetchPlanAccessAndStoreContext()
        }
    }, [isLoaded])

    const navigator = useNavigate();
    if (isError) {
        return <ErrorPage title="Something went wrong" />
    }
    if (!isDataLoaded) {
        return <LoadingPage title="Preparing Dashboard..." />;
    }
    if (!userId && isLoaded) {
        navigator("/signin");
    }
    return (
        <div
            className={classNames(
                "grid min-h-screen ", // Add overflow-hidden to remove scrollbars
                {
                    "grid-cols-sidebar": !collapsed,
                    "grid-cols-sidebar-collapsed": collapsed,
                    "transition-[grid-template-columns] duration-300 ease-in-out": true,
                }
            )}
        >
            {/* Sidebar */}
            <Sidebar collabsable={collapsed} />

            {/* Collapse button */}
            <div className="relative w-full h-full">
                <button
                    className="absolute top-1 left-1 z-50"
                    onClick={() => setSidebarCollapsed(!collapsed)}
                >
                    <TooltipProvider>
                        <Tooltip delayDuration={90}>
                            <TooltipTrigger>
                                <div className="p-2 hover:bg-yellow rounded-md ">
                                    <Columns2 />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                                <p>{collapsed ? "Open Sidebar " : "Close Sidebar"}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </button>

                {/* Main content */}
                <div>
                    <Outlet />
                </div>
            </div>
        </div>
    );
}

