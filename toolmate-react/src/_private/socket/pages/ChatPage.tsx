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
import { ArrowDownToDot, ExpandIcon, Send, LoaderPinwheel } from "lucide-react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

interface Message {
    role: string;
    message: string;
}

async function fetchChatHistory(sessionId: string, userId: string, pagination: { page: number, limit: number }) {
    try {
        const chat = await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/v1/getChatConversationHistory`, {
            sessionId,
            userId,
            pagination
        })
        console.log(chat.data.data, "is user data")
        return {
            success: true,
            data: chat.data.data
        }
    } catch (err: unknown) {
        console.log(err, "error");
        return {
            success: false,
            message: "Can't Load Your Chat History"
        }

    }
}


export function ChatPage() {
    const [conversation, setConversation] = useState<Message[]>([]);
    const [currStreamingRes, setCurrStreamingRes] = useState("");
    const { sessionId } = useParams<{ sessionId: string }>();
    const socket = useSocket();
    const { userData, unshiftiChatname } = useContext(UserContext);
    const [searchParams, setSearchParams] = useSearchParams();
    const isNew = Boolean(searchParams.get("new"));

    const [mainInput, setMainInput] = useState("");
    const [isExpanded, setIsExpanded] = useState(false);
    const [mateyExpression, setMateyExpression] = useState("");
    const [stateOfButton, setStateOfButton] = useState(-1);
    const [pagination, setPagiantion] = useState({ page: 1, limit: 10 });
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
            console.log("Loading Chat History", isNew, isFetchAllowed)
            if (!isNew && isFetchAllowed) {
                console.log("Fetching Chat History")
                setIsLoadingHistory(true);
                const chatData = await fetchChatHistory(sessionId || "", userData?.id || "", pagination);
                if (!chatData.success) {
                    console.log(chatData, "chatData")
                    toast({
                        title: "Error",
                        description: chatData.message,
                        variant: "destructive"
                    })
                    setIsError(true);
                }
                setConversation(chatData.data);
                setIsLoadingHistory(false);
            }
        }



        fetchHistory();
    }, [sessionId])

    useEffect(() => {
        if (currStreamingRes !== "") {
            const lastConversationItem = conversation[conversation.length - 1];
            if (lastConversationItem?.role === "ai") {
                const newConversation = conversation.slice(0, -1);
                setConversation([...newConversation, { role: "ai", message: currStreamingRes }]);
            } else {
                setConversation([...conversation, { role: "ai", message: currStreamingRes }]);
            }
        }


    }, [currStreamingRes]);

    useEffect(() => {
        if (isNew) {

            const initialMessage = localStorage.getItem('userPrompt') || "Hey Matey!";
            setConversation((prevData) => [
                ...prevData,
                { role: "user", message: initialMessage },
            ]);

            if (socket && userData) {
                socket.emit("getChatName", {
                    prompt: initialMessage,
                    sessionId: sessionId,
                    userId: userData?.id,
                });
                console.log("Emitting Chat Name")

                socket.emit("userMessage", {
                    sessionId: sessionId,
                    message: initialMessage,
                });

                socket.on('chatName', (data) => {
                    console.log(data, "chatName-----------------------")
                    unshiftiChatname({
                        chatName: data.chatName,
                        sessionId: data.sessionId,
                        id: data.id
                    });
                });
            }
            searchParams.delete("new");
            setSearchParams(searchParams);
            localStorage.removeItem('userPrompt');
        }

        const handleMessage = (data: { text: string }) => {
            setCurrStreamingRes((prevData) => prevData + data.text);
        };

        socket?.on("message", handleMessage);
        socket?.on("terminate", () => {
            setStateOfButton(-1);
            setCurrStreamingRes("");
        });

        return () => {
            socket?.off("message", handleMessage);
            localStorage.setItem('retrieveChat', "yes")
        };
    }, [socket, isNew, userData, sessionId, searchParams, setSearchParams]);

    useEffect(() => {
        scrollToBottom();
    }, [conversation]);

    const handleUserPrompt = () => {
        const newConversation = [...conversation, { role: "user", message: mainInput }];
        setConversation(newConversation);
        socket?.emit("userMessage", {
            sessionId: sessionId,
            message: mainInput,
        });
    };

    if (!isNew && isLoadingHistory) {
        return (
            <div className="w-full h-screen flex justify-center items-center">
                <div className="w-full h-full flex flex-col items-center justify-center gap-4">
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
            <div className="w-full h-screen flex justify-center items-center flex-col">
                <MateyExpression expression="thinking" />
                <p className="text-lg text-center font-semibold capitalize">
                    Error Occured While Fetching Chat History
                </p>

            </div>
        )
    }

    return (
        <div className={`flex flex-col h-screen p-6 ${conversation.length == 1 ? "items-end" : "items-center"}`}>
            <div className="flex-grow  overflow-y-scroll max-w-4xl mt-10 relative" style={{ paddingRight: '1rem' }}>
                {conversation?.map((data: Message, index) => (
                    <div key={index}>
                        {data.role === "ai" ? (
                            <Aichat message={data.message.replace("Typing...", "")} />
                        ) : (
                            <div className="w-full flex justify-end items-end">
                                <div className="flex w-fit justify-end px-3 py-2 bg-yellow rounded-md">
                                    {data.message}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                <div ref={messagesEndRef} />

            </div>
            <div className="max-w-4xl w-full flex gap-0 border-2 bg-slate-100 border-lightOrange mt-2 rounded-lg flex-col">
                <textarea
                    value={mainInput}
                    onChange={(e) => setMainInput(e.target.value)}
                    placeholder="Give Your Idea To Matey."
                    className="w-full rounded-t-lg rounded-b-none pr-12 bg-slate-50 outline-none focus:outline-none focus:ring-0 placeholder-slate-900 text-slate-900 transition-all duration-1000 ease-in-out"
                    rows={isExpanded ? 9 : 3}
                    style={{ transition: "height 0.3s ease-in-out" }}
                />
                <div className="p-2 h-14 border-t-2 border-lightOrange justify-between items-center w-full flex space-x-2">
                    <MateyExpression expression={mateyExpression} />
                    <div className="flex gap-4 items-center">
                        <TooltipProvider>
                            <Tooltip delayDuration={10}>
                                <TooltipTrigger>
                                    <div onClick={scrollToBottom}>
                                        <ArrowDownToDot className="cursor-pointer text-slate-600 hover:text-orange" />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Scroll To Bottom</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                            <Tooltip delayDuration={10}>
                                <TooltipTrigger className="flex items-center justify-center">
                                    <button
                                        onClick={() => setIsExpanded((prev) => !prev)}
                                        className="text-slate-600 hover:text-orange"
                                    >
                                        <ExpandIcon className="w-6 h-6" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Expand Text Area</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <button
                            onClick={handleUserPrompt}
                            disabled={stateOfButton === 0}
                            className="bg-orange rounded-md p-2 hover:bg-lightOrange hover:shadow-md hover:shadow-light"
                        >
                            {stateOfButton === -1 ? (
                                <Send size={22} />
                            ) : stateOfButton === 0 ? (
                                <LoaderPinwheel className="animate-spin" />
                            ) : (
                                <div className="w-1 h-1 bg-slate-500 rounded-sm"></div>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}