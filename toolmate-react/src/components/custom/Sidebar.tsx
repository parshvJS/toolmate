"use client"

import { useState, useContext, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import DarkLogo from "./DarkLogo"
import LogoSmall from "./LogoSmall"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Skeleton } from "../ui/skeleton"
import { UserContext } from "@/context/userContext"
import { iChatname } from "@/types/types"
import { Ellipsis } from "lucide-react"
import { useParams } from "react-router-dom"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import CommunityCreationDialog from "./CommunityForm"

export default function ImprovedAnimatedSidebar({
    collabsable = false,
    setCollabsable,
}: {
    collabsable?: boolean
    setCollabsable?: React.Dispatch<React.SetStateAction<boolean>>
}) {
    const { historyData, isLoading, isFetching } = useContext(UserContext)
    const [animatedHistory, setAnimatedHistory] = useState<iChatname[]>([])
    const isInitialMount = useRef(true)
    const { sessionId } = useParams<{ sessionId: string }>();
    const [open, setOpen] = useState("")
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false
            setAnimatedHistory(historyData || [])
        } else if (historyData && historyData.length > 0) {
            const newItems = historyData.filter(
                (item) => !animatedHistory.some((existingItem) => existingItem.dateDiff === item.dateDiff)
            )
            if (newItems.length > 0) {
                setAnimatedHistory((prev) => [...newItems, ...prev])
            }
        }
    }, [historyData])

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
    ]

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

            <CommunityCreationDialog 
                collabsable={collabsable}
            />


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
                {isLoading || isFetching ? (
                    <div className="space-y-2">
                        {Array.from({ length: 10 }).map((_, index) => (
                            <Skeleton key={index} className="h-5 w-full bg-mangoYellow mt-1" style={{ opacity: 1 }} />
                        ))}
                    </div>
                ) : (
                    <AnimatePresence>
                        {animatedHistory.map((item: iChatname, index) => (
                            <motion.div
                                key={index}
                                initial={isInitialMount.current ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                            >
                                <p className="font-bold text-black capitalize text-left sticky top-0 px-2  py-2 bg-whiteYellow z-10">
                                    {item.dateDiff.replace(/_/g, " ")}
                                </p>
                                <div className="text-left px-1">
                                    <AnimatePresence>
                                        {item.data.map((chat, chatIndex) => {
                                            const isActive = sessionId === chat.sessionId;

                                            return <motion.div

                                                key={chat.chatName}
                                                initial={isInitialMount.current ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                transition={{
                                                    duration: 0.3,
                                                    delay: chatIndex * 0.05,
                                                    ease: [0.25, 0.1, 0.25, 1]
                                                }}
                                                className={`${isActive && "bg-paleYellow"} font-normal flex justify-between  py-[7px] px-2 hover:bg-paleYellow transition-all cursor-pointer rounded-lg w-full group`}
                                            >
                                                <div className={`overflow-hidden whitespace-nowrap text-ellipsis flex justify-between`} style={{ maxWidth: '100%' }}>
                                                    {chat.chatName.length > 28 ? chat.chatName.replace(/"/g, '').slice(0, 28) + "..." : chat.chatName.replace(/"/g, '')}
                                                </div>
                                                {/* 3 dot */}
                                                <div className="hover:bg-lightYellow rounded-md transition-opacity">
                                                    <DropdownMenu onOpenChange={(state) => state ? setOpen(chat.sessionId) : setOpen("")}>
                                                        <DropdownMenuTrigger
                                                            className={`w-6 h-6 flex items-center justify-center transition-opacity ${open == chat.sessionId ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                                                }`}
                                                        >
                                                            <Ellipsis />
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent className="bg-softYellow" side="bottom">

                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>


                                            </motion.div>
                                        })}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
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
                                onClick={() => setCollabsable && setCollabsable(false)}
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
    )
}