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
} from "@/components/ui/tooltip";
import { History } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { useContext, useEffect, useState } from "react";
import { UserContext } from "@/context/userContext";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { iChatname } from "@/types/types";
import TextOverflow from "./TextOverflow";

export default function Sidebar({
    collabsable = false,
    setCollabsable,
}: {
    collabsable?: boolean;
    setCollabsable?: any;
}) {
    const { toast } = useToast();
    const { data } = useContext(UserContext);
    const [isHistoryLoading, setIsHistoryLoading] = useState(true);
    const [chatHistory, setChatHistory] = useState<iChatname[]>([]);

    useEffect(() => {
        async function fetchHistory() {
            try {
                const historyData = await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/v1/getChatHistory`, {
                    userId: data?.id
                });
                setChatHistory(historyData.data.data);
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Error while fetching history",
                    variant: "destructive",
                });
            } finally {
                setIsHistoryLoading(false);
            }
        }
        fetchHistory();
    }, []);

    const navItem = [
        {
            icon: "/assets/icons/communityNavIcon.svg",
            title: "Explore Community",
            href: "/community",
        },
        {
            icon: "/assets/icons/userCommunityNavIcon.svg",
            title: "My Community",
            href: "/my-community",
        },
    ];

    return (
        <div className={`bg-whiteYellow border-r-2 border-slate-300 h-screen flex flex-col ${collabsable ? "px-1" : "px-3"}`}>
            {/* Logo */}
            <div className={`flex mt-5 items-center ${collabsable ? "justify-center" : "justify-start"}`}>
                {!collabsable ? <DarkLogo /> : <LogoSmall />}
            </div>

            <hr className="border border-l-stone-300 my-2" />

            {/* Tooltip - Create New Chat */}
            <TooltipProvider>
                <Tooltip delayDuration={70}>
                    <TooltipTrigger className={`${collabsable ? "block" : "hidden"}`}>
                        <img
                            src="/assets/matey-emoji/tool.svg"
                            alt="new chat"
                            className="p-1 bg-mangoYellow hover:bg-softYellow rounded-lg w-14 h-14 cursor-pointer"
                        />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-paleYellow">
                        <p>Create New Chat</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            {/* New Chat Button (Expanded View) */}
            <div className={`${collabsable ? "hidden" : "flex"} px-3 items-center gap-3 hover:bg-softYellow cursor-pointer rounded-lg bg-mangoYellow transition duration-300 ease-in-out`}>
                <img src="/assets/matey-emoji/tool.svg" alt="new chat" className="w-12 h-12" />
                <p className="font-semibold">New Chat</p>
            </div>

            <hr className="border border-l-stone-300 my-2" />

            {/* Navigation Items */}
            <div className={`${collabsable ? "hidden" : "flex"} flex-col`}>
                {navItem.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 py-2 px-4 hover:bg-softYellow cursor-pointer rounded-lg">
                        <img src={item.icon} alt={item.title} className="w-8 h-8" />
                        <p className="font-semibold text-sm">{item.title}</p>
                    </div>
                ))}
            </div>


            {/* Chat History */}
            <div className={`flex-1 overflow-y-auto ${collabsable ? "hidden" : "block"} space-y-2 hide-scrollbar`}>
                <hr className="border border-l-stone-300 my-2" />
                {isHistoryLoading ? (
                    <div className="space-y-2">
                        {Array.from({ length: 10 }).map((_, index) => (
                            <Skeleton key={index} className="h-5 w-full bg-mangoYellow mt-1" style={{ opacity: 1 - index * 0.1 }} />
                        ))}
                    </div>
                ) : (
                    chatHistory.length !== 0 &&
                    chatHistory.map((item: iChatname, index) => {
                        return (
                            <div key={index} >
                                <p className="font-bold text-black capitalize text-left sticky top-0 px-2 bg-whiteYellow py-2 z-10">
                                    {item.dateDiff.replace(/_/g, " ")}
                                </p>
                                <div className="text-left px-2">
                                    {item.data.map((chat, index) => {
                                        return <div className="font-normal py-1 hover:bg-mangoYellow transition-all cursor-pointer px-3 rounded-md w-full " key={index}>

                                            <div
                                                className={`overflow-hidden whitespace-nowrap text-ellipsis`}
                                                style={{ maxWidth: '100%' }}  // Adjust the width as needed
                                            >
                                                {chat.chatName.replace('"', '')}
                                            </div>
                                        </div>;
                                    })}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Mobile Navigation */}
            <div className={`${collabsable ? "flex" : "hidden"} flex-col gap-2`}>
                {navItem.map((item, index) => (
                    <TooltipProvider key={index}>
                        <Tooltip delayDuration={70}>
                            <TooltipTrigger>
                                <div className="flex items-center p-1 py-2 justify-center hover:bg-softYellow cursor-pointer rounded-lg">
                                    <img src={item.icon} alt={item.title} className="w-8 h-8" />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="bg-paleYellow">
                                <p>{item.title}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ))}
            </div>

            {/* History Button (Collapsed View) */}
            <div className={`${collabsable ? "flex" : "hidden"}`}>
                <TooltipProvider>
                    <Tooltip delayDuration={70}>
                        <TooltipTrigger>
                            <div
                                onClick={() => setCollabsable(false)}
                                className="flex items-center py-3 px-4 justify-center hover:bg-softYellow cursor-pointer rounded-lg"
                            >
                                <img src="/assets/icons/history.svg" alt="history" className="w-6 h-6" />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-paleYellow">
                            <p>History</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </div>
    );
}
