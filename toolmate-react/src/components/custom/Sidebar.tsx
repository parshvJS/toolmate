"use client"

import { useState, useContext, useEffect, useRef, useMemo } from "react"
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
import { AlertTriangle, Ellipsis, Pencil, Trash, Trash2 } from "lucide-react"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import CommunityCreationDialog from "./CommunityForm"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import axios from "axios"
import { useToast } from "@/hooks/use-toast"
import { DialogDescription } from "@radix-ui/react-dialog"

const navItem = [
    {
        icon: "/assets/icons/communityNavIcon.svg",
        title: "Explore Community",
        href: "/explore-community",
    },
    {
        icon: "/assets/icons/userCommunityNavIcon.svg",
        title: "My Community",
        href: "/my-community",
    },
]
export default function ImprovedAnimatedSidebar({
    collabsable = false,
    setCollabsable,
}: {
    collabsable?: boolean
    setCollabsable?: React.Dispatch<React.SetStateAction<boolean>>
}) {
    const navigate = useNavigate()
    const { historyData, isLoading, isFetching, newIdForCache, deleteCacheElement } = useContext(UserContext)
    const [animatedHistory, setAnimatedHistory] = useState<iChatname[]>([])
    const isInitialMount = useRef(true)
    const { sessionId } = useParams<{ sessionId: string }>();
    const [open, setOpen] = useState("")
    const [dropDownDialog, setDropDownDialog] = useState(false)
    const [activeDialog, setActiveDialog] = useState("")
    const [newName, setNewName] = useState("")
    const [isRenaming, setIsRenaming] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [deleteId, setDeleteId] = useState("")
    const [deleteDialog, setDeleteDialog] = useState(false)

    const { toast } = useToast()

    // useEffect(() => {
    //     if (!historyData || historyData.length === 0) return; // Exit if no data

    //     // Filter out items that already exist in animatedHistory based on dateDiff
    //     const newItems = historyData.filter(
    //         (item) => !animatedHistory.some((existingItem) => existingItem.dateDiff === item.dateDiff)
    //     );

    //     // Check for duplicate sessionId in new items
    //     const isDuplicate = animatedHistory.some((existingItem) =>
    //         existingItem.data.some((chat) => chat.sessionId === sessionId)
    //     );

    //     if (newItems.length > 0 && !isDuplicate) {
    //         setAnimatedHistory((prevAnimatedHistory) => [
    //             ...prevAnimatedHistory,
    //             ...newItems,
    //         ]);
    //     }
    // }, [sessionId]); // Only depend on historyData and sessionId


    // useEffect(() => {
    //     console.log("animatedHistory", animatedHistory)
    //     setAnimatedHistory((prev) => {
    //         const uniqueHistory = prev.filter(
    //             (item, index, self) =>
    //                 index === self.findIndex((t) => t.dateDiff === item.dateDiff)
    //         );
    //         return uniqueHistory;
    //     })
    // },[])

    const filteredHistory = useMemo(() => {
        if (!historyData || historyData.length === 0) return [];
        return historyData.filter(
            (item) => !animatedHistory.some((existingItem) => existingItem.dateDiff === item.dateDiff)
        );
    }, [historyData, animatedHistory]);

    useEffect(() => {
        if (filteredHistory.length > 0) {
            setAnimatedHistory((prev) => [...filteredHistory, ...prev]);
        }
    }, [filteredHistory]);

    function handleChatClick(sessionId: string, id: string) {
        navigate(`/matey/${sessionId}`)
        newIdForCache(id)
    }

    useEffect(() => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === "style" && document.body.style.pointerEvents === "none" && !dropDownDialog) {
                    document.body.style.pointerEvents = 'auto'; // Reset it when the dialog is closed
                }
            });
        });

        // Start observing changes to the body's style attribute
        observer.observe(document.body, { attributes: true });

        return () => observer.disconnect(); // Clean up when component unmounts
    }, [dropDownDialog]);


    async function handleRenameChat(id: string, newName: string) {
        try {
            if (newName === "") return
            setIsRenaming(true)
            const { data } = await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/v1/changeChatName`, {
                id: id,
                newName: newName
            })

            if (data.success) {
                toast({
                    title: "Success",
                    description: "Chat renamed successfully",
                    variant: "success"
                })
                console.log("Chat renamed successfully")
                historyData?.forEach((item) => {
                    item.data.forEach((chat) => {
                        if (chat.id === id) {
                            chat.chatName = newName
                        }
                    })
                })
            } else {
                toast({
                    title: "Error",
                    description: "Failed to rename chat",
                    variant: "destructive"
                })
            }
            setDropDownDialog(false)
        } catch (error) {
            console.log(error)
            toast({
                title: "Error",
                description: "An error occurred while renaming the chat",
                variant: "destructive"
            })
        } finally {
            setIsRenaming(false)
        }
    }


    async function handleDelete(id: string) {
        try {
            setIsDeleting(true)
            const { data } = await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/v1/deleteChat`, {
                id: id
            })

            if (data.success) {
                deleteCacheElement(deleteId)

                toast({
                    title: "Success",
                    description: "Chat deleted successfully",
                    variant: "success"
                })
                console.log("Chat deleted successfully")
                const updatedHistory = historyData?.map((item) => {
                    item.data = item.data.filter((chat) => chat.id !== id)
                    return item
                })
                setAnimatedHistory(updatedHistory || [])
                navigate("/dashboard")
            } else {
                toast({
                    title: "Error",
                    description: "Failed to delete chat",
                    variant: "destructive"
                })
            }

        } catch (error) {
            console.log(error)
            toast({
                title: "Error",
                description: "An error occurred while deleting the chat",
                variant: "destructive"
            })
        } finally {
            setIsDeleting(false)
            setDeleteDialog(false)
        }
    }


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
                            className="p-1 bg-lighterYellow hover:bg-softYellow rounded-lg w-14 h-14 cursor-pointer"
                        />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-paleYellow">
                        <p>Create New Chat</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            {/* New Chat Button (Expanded View) */}
            <div className={`${collabsable ? "hidden" : "flex"} px-3 items-center gap-3 hover:bg-softYellow cursor-pointer rounded-lg bg-lighterYellow transition duration-300 ease-in-out`}>
                <img src="/assets/matey-emoji/tool.svg" alt="new chat" className="w-12 h-12" />
                <p className="font-semibold">New Chat</p>
            </div>



            <hr className="border border-l-stone-300 my-2" />

            {/* Navigation Items */}
            <div className={`${collabsable ? "hidden" : "flex"} flex-col`}>
                {navItem.map((item, index) => (
                    <Link to={item.href} key={index} className="flex items-center gap-2 py-2 px-4 hover:bg-softYellow cursor-pointer rounded-lg">
                        <img src={item.icon} alt={item.title} className="w-8 h-8" />
                        <p className="font-semibold text-md">{item.title}</p>
                    </Link>
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
                                                onClick={() => {

                                                    handleChatClick(chat.sessionId, chat.id)
                                                }}
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
                                                <p className={`overflow-hidden whitespace-nowrap text-ellipsis flex justify-between`} style={{ maxWidth: '100%' }}>
                                                    {chat.chatName.length > 28 ? chat.chatName.replace(/"/g, '').slice(0, 28) + " ..." : chat.chatName.replace(/"/g, '')}
                                                </p>
                                                {/* 3 dot */}
                                                <div className="hover:bg-lightYellow rounded-md transition-opacity">
                                                    <DropdownMenu onOpenChange={(state) => state ? setOpen(chat.sessionId) : setOpen("")}>
                                                        <DropdownMenuTrigger
                                                            className={`w-6 h-6 flex items-center justify-center transition-opacity ${open == chat.sessionId ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                                                }`}
                                                        >
                                                            <Ellipsis />
                                                        </DropdownMenuTrigger>

                                                        <DropdownMenuContent>
                                                            {open === chat.sessionId && (
                                                                <DropdownMenuItem onSelect={() => {
                                                                    setDropDownDialog(true)
                                                                    setActiveDialog(chat.id)
                                                                }}
                                                                >
                                                                    <div className="flex gap-4 items-center">
                                                                        <Pencil width={17} height={17} />
                                                                        <p className="font-semibold">Rename</p>
                                                                    </div>
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuItem onSelect={() => { setDeleteDialog(true); setDeleteId(chat.id); }}>
                                                                <div className="flex gap-4 items-center text-red-500">
                                                                    <Trash width={17} height={17} />
                                                                    <span className="font-semibold">Delete</span>
                                                                </div>
                                                            </DropdownMenuItem>
                                                            {/* <DropdownMenuItem>
                                                                <Button onClick={() => setDeleteDialog(true)} variant="ghost" className=" flex gap-4 items-center"
                                                                >
                                                                    <Trash width={17} height={17} />
                                                                    <span>Delete</span>
                                                                </Button>
                                                            </DropdownMenuItem> */}
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


            {/* dialog for rename   */}

            <Dialog open={dropDownDialog} onOpenChange={() => setDropDownDialog(false)}>
                <AnimatePresence>
                    {dropDownDialog && (
                        <DialogContent className="sm:max-w-md bg-white border border-yellow/20 rounded-lg shadow-lg overflow-hidden">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-semibold text-gray-800">
                                        Rename Item
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="flex flex-col space-y-4 mt-4">
                                    <div className="relative">
                                        <Input
                                            type="text"
                                            placeholder="Enter new name"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow/50 focus:border-yellow bg-white text-gray-800 placeholder-gray-400"
                                        />
                                        <Pencil className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                    </div>
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <Button
                                            onClick={() => {
                                                handleRenameChat(activeDialog, newName)
                                            }}
                                            className="w-full bg-softYellow hover:bg-yellow/90 text-black font-semibold py-2 px-4 rounded-md transition-colors duration-200"
                                        >
                                            {
                                                isRenaming ? "Renaming..." : "Rename"
                                            }
                                        </Button>
                                    </motion.div>
                                </div>
                                <p className="mt-4 text-center text-gray-600 text-md">
                                    Choose a clear and descriptive name for easy identification.
                                </p>
                            </motion.div>
                        </DialogContent>
                    )}
                </AnimatePresence>
            </Dialog>



            {/* delete  */}


            <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>

                <AnimatePresence>
                    {deleteDialog && (
                        <DialogContent className="sm:max-w-md bg-white border border-red-200 rounded-lg shadow-lg overflow-hidden">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-semibold text-red-600 flex items-center justify-center">
                                        <AlertTriangle className="mr-2 text-red-500" size={24} />
                                        Delete Chat
                                    </DialogTitle>
                                </DialogHeader>
                                <DialogDescription>
                                    <div className="flex flex-col space-y-4 mt-4">
                                        <p className="text-center text-gray-700">
                                            Are you sure you want to delete this chat? This action cannot be undone.
                                        </p>
                                        <div className="flex justify-center space-x-4">
                                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                                <Button
                                                    onClick={() => setDeleteDialog(false)}
                                                    variant="secondary"
                                                    className="font-medium"
                                                >
                                                    Cancel
                                                </Button>
                                            </motion.div>
                                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                                <Button
                                                    onClick={() => { handleDelete(deleteId) }}
                                                    variant="destructive"
                                                    className="font-medium flex items-center"
                                                >
                                                    <Trash2 className="mr-2" size={18} />
                                                    Delete
                                                </Button>
                                            </motion.div>
                                        </div>
                                    </div>
                                </DialogDescription>
                                <DialogFooter>


                                    <p className="mt-4 text-center text-gray-500 text-md">
                                        This will permanently remove all messages in this chat.
                                    </p>
                                </DialogFooter>
                            </motion.div>
                        </DialogContent>
                    )}
                </AnimatePresence>
            </Dialog>
        </div>
    )
}