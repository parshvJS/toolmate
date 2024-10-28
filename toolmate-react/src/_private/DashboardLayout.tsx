import React, { useContext, useState, useEffect } from "react";
import LoadingPage from "@/components/custom/LoadingPage";
import Sidebar from "@/components/custom/Sidebar";
import { useAuth } from "@clerk/clerk-react";
import classNames from "classnames";
import { Outlet, useNavigate } from "react-router-dom";
import ErrorPage from "@/components/custom/ErrorPage";
import { UserContext } from '@/context/userContext';
import { RightSidebarProvider } from "@/context/rightSidebarContext";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogClose
} from "@/components/ui/dialog";

interface Coordinates {
    latitude: number | null;
    longitude: number | null;
}

const DashboardLayout: React.FC = () => {
    const { isLoading, isError } = useContext(UserContext);
    const { isLoaded, userId } = useAuth();
    const [collapsed, setSidebarCollapsed] = useState<boolean>(false);
    const navigate = useNavigate();

    const [hasLocationAccess, setHasLocationAccess] = useState<boolean | null>(null);
    const [coords, setCoords] = useState<Coordinates>({ latitude: null, longitude: null });
    const [locationError, setLocationError] = useState<string | null>("Location Is Not Available");
    const [locationAccessDialogOpen, setLocationAccessDialogOpen] = useState<boolean>(true); // Start with the dialog open

    useEffect(() => {
        if (isLoaded && !userId) {
            navigate("/signin");
        }
    }, [isLoaded, userId, navigate]);

    const checkLocationAccess = () => {
        if ("geolocation" in navigator) {
            navigator.permissions.query({ name: "geolocation" }).then((permissionStatus) => {
                if (permissionStatus.state === "granted") {
                    navigator.geolocation.getCurrentPosition((position) => {
                        const { latitude, longitude } = position.coords;
                        setCoords({ latitude, longitude });
                        setHasLocationAccess(true);
                        setLocationAccessDialogOpen(false); // Close dialog when access is granted
                    });
                } else if (permissionStatus.state === "denied") {
                    setLocationError("Location access denied. Please enable it in your browser settings.");
                    setHasLocationAccess(false);
                    // Keep the dialog open to encourage the user to change their settings
                    setLocationAccessDialogOpen(true);
                } else if (permissionStatus.state === "prompt") {
                    // If the user has not yet made a choice, ask for permission
                    navigator.geolocation.getCurrentPosition((position) => {
                        const { latitude, longitude } = position.coords;
                        setCoords({ latitude, longitude });
                        setHasLocationAccess(true);
                        setLocationAccessDialogOpen(false); // Close dialog if granted
                    }, (error) => {
                        setLocationError("Location access denied. Please enable it in your browser settings.");
                        setHasLocationAccess(false);
                        // Keep the dialog open
                        setLocationAccessDialogOpen(true);
                    });
                }
            });
        } else {
            setLocationError("Geolocation is not supported by your browser.");
            setHasLocationAccess(false);
            setLocationAccessDialogOpen(true);
        }
    };

    useEffect(() => {
        checkLocationAccess();
        window.addEventListener("focus", checkLocationAccess);
        return () => {
            window.removeEventListener("focus", checkLocationAccess);
        };
    }, []);

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
            {/* Dialog to inform user about location access */}
            <Dialog open={locationAccessDialogOpen} >
                <DialogContent className="[&>button]:hidden">
                    <DialogHeader>
                        <DialogDescription>
                            <div className="flex items-center gap-6 text-left">
                                <img
                                    src="/assets/matey-emoji/location.svg"
                                    alt="Location"
                                    className="w-16 h-16"
                                />
                                <p className="text-xl font-bold text-black">
                                    Location Access Needed
                                </p>
                            </div>
                            <p className="text-md border-2 border-red-400 bg-red-200 p-4 rounded-md text-gray-700 mt-4 text-center">
                                {locationError}
                            </p>
                            <p className="text-md text-gray-700 mt-6 text-left">
                                ToolMate provides you with a large range of product suggestions. Without your location access, we can't provide you with the best results.
                            </p>
                            <ol className="mt-6 flex flex-col gap-2 font-semibold list-decimal list-inside text-md text-gray-700 space-y-2">
                                <li>Click on the location icon in the URL bar on the right side.</li>
                                <li className="leading-7">{`Alternatively, go to Settings > Search permissions > Click on "Sites" or "All Sites".`}</li>
                                <li>{`Find ${import.meta.env.VITE_SITE_URL} > Location > Allow.`}</li>
                            </ol>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogClose className="hidden" /> {/* Hide the close button */}
                </DialogContent>
            </Dialog>

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
                <Sidebar collabsable={collapsed} setCollabsable={setSidebarCollapsed} />
                <div className="relative w-full h-full">
                    <div className="scrollbar-hide">
                        <Outlet />
                    </div>

                </div>
            </div>
        </RightSidebarProvider>
    );
};

export default DashboardLayout;
