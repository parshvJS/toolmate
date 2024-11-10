import React, { useContext, useState, useEffect } from "react";
import LoadingPage from "@/components/custom/LoadingPage";
import Sidebar from "@/components/custom/Sidebar";
import { useAuth } from "@clerk/clerk-react";
import classNames from "classnames";
import { Outlet, useNavigate } from "react-router-dom";
import ErrorPage from "@/components/custom/ErrorPage";
import { UserContext } from '@/context/userContext';
import { RightSidebarProvider } from "@/context/rightSidebarContext";

const DashboardLayout: React.FC = () => {
    const { isLoading, isError } = useContext(UserContext);
    const { isLoaded, userId } = useAuth();
    const [collapsed, setSidebarCollapsed] = useState<boolean>(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (isLoaded && !userId) {
            navigate("/signin");
        }
    }, [isLoaded, userId, navigate]);

    if (!isLoaded) {
        return <LoadingPage title="Preparing Dashboard..." />;
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
                    "md:grid min-h-screen scrollbar-hide  ",
                    {
                        "md:grid-cols-main-sidebar": !collapsed,
                        "md:grid-cols-main-sidebar-collapsed": collapsed,
                        "transition-[grid-template-columns] duration-300 ease-in-out": true,
                    }
                )}
            >
               
                <div className="">
                    <Sidebar collabsable={collapsed} setCollabsable={setSidebarCollapsed} />
                </div>
                <div className="relative w-full ">
                    <div className="scrollbar-hide">
                        <Outlet />
                    </div>
                </div>
            </div>
        </RightSidebarProvider>
    );
};

export default DashboardLayout;
