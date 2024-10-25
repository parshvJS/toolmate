import { useContext, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import Aichat from "@/components/custom/Aichat";
import MateyExpression from "@/components/custom/MateyExpression";
import { useSocket } from "@/context/socketContext";
import { UserContext } from "@/context/userContext";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import { ArrowDownToDot, ExpandIcon, Send, LoaderPinwheel, CircleDashed } from "lucide-react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

interface Message {
    role: string;
    message: string;
}

async function fetchChatHistory(sessionId: string, userId: string, pagination: { page: number, limit: number }) {
    try {
        const response = await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/v1/getChatConversationHistory`, {
            sessionId,
            userId,
            pagination
        });
        return { success: true, data: response.data.data };
    } catch (error) {
        console.error("Error fetching chat history", error);
        return { success: false, message: "Can't Load Your Chat History" };
    }
}

export function ChatPage() {
    const [conversation, setConversation] = useState<Message[]>([]);
    const [currStreamingRes, setCurrStreamingRes] = useState("");
    const { sessionId } = useParams<{ sessionId: string }>();
    const socket = useSocket();
    const { userId, userData, unshiftiChatname } = useContext(UserContext);
    const [searchParams, setSearchParams] = useSearchParams();
    const isNew = Boolean(searchParams.get("new"));
    const [isNotificationOn, setIsNotificationOn] = useState(false);
    const [notificationText, setNotificationText] = useState("Matey is Adding...");
    const [mainInput, setMainInput] = useState("");
    const [isExpanded, setIsExpanded] = useState(false);
    const [mateyExpression, setMateyExpression] = useState("");
    const [stateOfButton, setStateOfButton] = useState(-1);
    const [pagination, setPagination] = useState({ page: 1, limit: 10 });
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [isError, setIsError] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const { toast } = useToast();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        async function fetchHistory() {
            const isFetchAllowed = localStorage.getItem('retrieveChat') === "yes";
            if (!isNew && isFetchAllowed) {
                setIsLoadingHistory(true);
                console.log("Fetching Chat History", sessionId, userData?.id, pagination);
                const chatData = await fetchChatHistory(sessionId, userData?.id, pagination);
                if (!chatData.success) {
                    toast({
                        title: "Error",
                        description: chatData.message,
                        variant: "destructive",
                    });
                    setIsError(true);
                } else {
                    setConversation(chatData.data);
                }
                setIsLoadingHistory(false);
            }
        }

        fetchHistory();
    }, [sessionId]);

    useEffect(() => {
        if (currStreamingRes) {
            setConversation((prev) =>
                prev[prev.length - 1]?.role === "ai"
                    ? [...prev.slice(0, -1), { role: "ai", message: currStreamingRes }]
                    : [...prev, { role: "ai", message: currStreamingRes }]
            );
        }
    }, [currStreamingRes]);

    useEffect(() => {
        if (isNew) {
            const initialMessage = localStorage.getItem('userPrompt') || "Hey Matey!";
            setConversation((prev) => [...prev, { role: "user", message: initialMessage }]);

            if (socket && userData) {
                socket.emit("getChatName", { prompt: initialMessage, sessionId, userId: userData?.id });
                socket.emit("userMessage", { sessionId, message: initialMessage, userId: userId });

                socket.on('chatName', (data) => {
                    unshiftiChatname({ chatName: data.chatName, sessionId: data.sessionId, id: data.id });
                });
            }
            searchParams.delete("new");
            setSearchParams(searchParams);
            localStorage.removeItem('userPrompt');
        }

        const handleMessage = (data: { text: string }) => {
            setCurrStreamingRes((prev) => prev + data.text);
        };

        socket?.on("message", handleMessage);
        socket?.on("terminate", () => {
            setStateOfButton(-1);
            setCurrStreamingRes("");
        });

        return () => {
            socket?.off("message", handleMessage);
            localStorage.setItem('retrieveChat', "yes");
        };
    }, [socket, isNew, userData, sessionId, searchParams, setSearchParams]);

    useEffect(scrollToBottom, [conversation]);

    const handleUserPrompt = () => {
        setConversation([...conversation, { role: "user", message: mainInput }]);
        socket?.emit("userMessage", { sessionId, message: mainInput, userId: userId });
        socket?.on('status', function (data) {
            setIsNotificationOn(true);
            setNotificationText(data.message);
        });
        socket?.on('statusOver', function () {
            setIsNotificationOn(false);
            setNotificationText("")
        })
        socket?.on('productId',function (data){
            // query database for data  
        })
    };

    if (isLoadingHistory && !isNew) {
        return (
            <div className="flex justify-center items-center w-full h-screen">
                <div className="flex flex-col items-center justify-center gap-4">
                    <MateyExpression expression="tool" />
                    <p className="text-lg text-center font-semibold capitalize">
                        Matey is Recalling your chat...
                    </p>
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex flex-col justify-center items-center w-full h-screen">
                <MateyExpression expression="thinking" />
                <p className="text-lg text-center font-semibold capitalize">
                    Error Occurred While Fetching Chat History
                </p>
            </div>
        );
    }

    return (
        <div className={`flex flex-col h-screen p-6 ${conversation.length === 1 ? "items-end" : "items-center"}`}>
            <div className="flex-grow overflow-y-scroll max-w-4xl mt-10 pr-4 relative">
                {conversation.map((data, index) => (
                    <div key={index}>
                        {data.role === "ai" ? (
                            <Aichat message={data.message.replace("Typing...", "")} />
                        ) : (
                            <div className="w-full flex justify-end">
                                <div className="flex w-fit bg-yellow rounded-md px-3 py-2">
                                    {data.message}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div className="w-full flex flex-col items-center">
                {isNotificationOn && (
                    <motion.div
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="flex items-start w-full max-w-4xl gap-2 text-orange"
                    >
                        <CircleDashed className="animate-spin" />
                        <p className="animate-pulse font-semibold">{notificationText}</p>
                    </motion.div>
                )}
                <div className="max-w-4xl w-full bg-slate-100 border-2 border-lightOrange rounded-lg mt-2 flex flex-col">
                    <textarea
                        value={mainInput}
                        onChange={(e) => setMainInput(e.target.value)}
                        placeholder="Give Your Idea To Matey."
                        className="w-full bg-slate-50 rounded-t-lg pr-12 placeholder-slate-900 text-slate-900 outline-none focus:ring-0"
                        rows={isExpanded ? 9 : 3}
                        style={{ transition: "height 0.3s ease-in-out" }}
                    />
                    <div className="flex justify-between items-center p-2 border-t-2 border-lightOrange h-14">
                        <MateyExpression expression={mateyExpression} />
                        <div className="flex gap-4 items-center">
                            <TooltipProvider>
                                <Tooltip delayDuration={10}>
                                    <TooltipTrigger>
                                        <ArrowDownToDot className="cursor-pointer text-slate-600 hover:text-orange" onClick={scrollToBottom} />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Scroll To Bottom</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                                <Tooltip delayDuration={10}>
                                    <TooltipTrigger>
                                        <ExpandIcon
                                            className="cursor-pointer text-slate-600 hover:text-orange"
                                            onClick={() => setIsExpanded((prev) => !prev)}
                                        />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Expand Text Area</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <button
                                onClick={handleUserPrompt}
                                disabled={stateOfButton === 0}
                                className="bg-orange p-2 rounded-full shadow-md text-white hover:shadow-xl"
                            >
                                {stateOfButton === 0 ? (
                                    <LoaderPinwheel className="animate-spin" />
                                ) : (
                                    <Send />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
