import React, { useContext, useState, useEffect } from "react";
import LoadingPage from "@/components/custom/LoadingPage";
import Sidebar from "@/components/custom/Sidebar";
import { useAuth } from "@clerk/clerk-react";
import classNames from "classnames";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import ErrorPage from "@/components/custom/ErrorPage";
import { UserContext } from '@/context/userContext';
import { RightSidebarProvider } from "@/context/rightSidebarContext";
import { useToast } from "@/hooks/use-toast";

const DashboardLayout: React.FC = () => {
    const { isLoading, isError, userData } = useContext(UserContext);
    const { isLoaded, userId } = useAuth();
    const route = useLocation();
    const [collapsed, setSidebarCollapsed] = useState<boolean>(true);
    const navigate = useNavigate();
    const { toast } = useToast()
    const [isShowSidebar, setIsShowSidebar] = useState<boolean>(true);
    // useEffect(() => {
    //     if (userData && userData.planAccess) {
    //         const isFreeUser = userData.planAccess[0];
    //         if (isFreeUser) {
    //             toast({
    //                 title: "You Dont Have Access To Paid Feature!",
    //                 description: "Please Subscride to Premium Plan for Full Access To Matey",
    //                 variant: "destructive"
    //             })
    //             navigate('/pricing')
    //             return;
    //         }
    //     }
    // }, [isLoading,userId])

    useEffect(() => {
        const isFirstLogin = JSON.parse(localStorage.getItem('isFirstTimeLogin') || "false")
        if (!isFirstLogin) {
            localStorage.setItem('isFirstTimeLogin', "true")
            navigate('/pricing?redirected=true')
        }
    })
    useEffect(() => {
        if (isLoaded && !userId) {
            navigate("/signin");
        }
    }, [isLoaded, userId, navigate]);

    useEffect(() => {
        const routeToNotShowSidebar = [
            '/manage-subscription'
        ]
        function checkRoute() {
            if (routeToNotShowSidebar.includes(route.pathname)) {
                setIsShowSidebar(false)
            } else {
                setIsShowSidebar(true)
            }
        }

        if (route.pathname) {
            checkRoute()
        }

    }, [route])


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
                    "",
                    {
                        "md:grid min-h-screen scrollbar-hide": isShowSidebar,
                        "md:grid-cols-main-sidebar": !collapsed && isShowSidebar,
                        "md:grid-cols-main-sidebar-collapsed": collapsed && isShowSidebar,
                        "transition-[grid-template-columns] duration-300 ease-in-out": true && isShowSidebar,
                    }
                )}
            >

                <div className={`${isShowSidebar ? "block" : "hidden"}`}>
                    <Sidebar collabsable={collapsed} setCollabsable={setSidebarCollapsed} />
                </div>
                {
                    !isShowSidebar && <div className="w-0 h-0"></div>
                }
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
