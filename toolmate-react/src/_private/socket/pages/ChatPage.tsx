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
import { ProductItem } from "@/types/types";
import { ProductSuggestion, RightSidebarContext } from "@/context/rightSidebarContext";
import { getImageUrl } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@radix-ui/react-separator";

interface Message {
    role: string;
    message: string;
    productData?: ProductItem[];
    workQueue?: string[];
}

async function fetchChatHistory(sessionId: string | undefined, userId: string | undefined, pagination: { page: number, limit: number }) {
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


async function fetchCurrentMateyMemoryStatus(sessionId: string | undefined) {
    try {
        const response = await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/v1/getChatMemoryStatus`, {
            sessionId,
        });
        return { success: true, data: response.data.data };
    } catch (error) {
        console.error("Error fetching chat memory status", error);
        return { success: false, message: "Can't Load Your Chat Memory Status" };
    }

}
export function ChatPage() {
    const [conversation, setConversation] = useState<Message[]>([]);
    const [currStreamingRes, setCurrStreamingRes] = useState("");
    const { sessionId } = useParams<{ sessionId: string }>();
    const socket = useSocket();
    const { userId, userData, unshiftiChatname } = useContext(UserContext);
    const { setProductSuggestions, setBreakpoints, sliderValue, breakpoints } = useContext(RightSidebarContext);
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
    const [isMateyMemory, setIsMateyMemory] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const { toast } = useToast();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSocketEvents = () => {

        const handleMessage = (data: { text: string }) => {
            setCurrStreamingRes((prev) => prev + data.text);
        };
        console.log("Socket connected:", socket?.id);

        const handleChatName = (data: any) => {
            unshiftiChatname({ chatName: data.chatName, sessionId: data.sessionId, id: data.id });
        };

        const handleStatus = (data: any) => {
            setIsNotificationOn(true);
            setNotificationText(data.message);
        };

        const handleStatusOver = () => {
            setIsNotificationOn(false);
            setNotificationText("");
        };

        const handleBudgetSlider = (data: any) => {
            setBreakpoints(data);
        };

        const handleIntendList = (data: number[]) => {
            const workerQueue = data.map((item) => {
                switch (item) {
                    case 2: return "Suggested community support";
                    case 3: return "Recommended useful products";
                    case 4: return "Asked clarifying questions";
                    case 5: return "Provided project guidance as needed";
                }
            });
            setConversation((prev) => {
                const lastMessage = prev[prev.length - 1];
                if (lastMessage.role === "ai") {
                    return [...prev.slice(0, -1), { ...lastMessage, workQueue: workerQueue }];
                }
                return [...prev, { role: "ai", message: "", workQueue: workerQueue }];
            });
        };

        const handleProductId = async (data: { productId: ProductItem[] }) => {
            const productData = await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/v1/getProductFromId`, data.productId);
            if (productData.status === 200) {
                const refinedData: ProductSuggestion[] = productData.data.data.map((item: any) => ({
                    name: item.categoryName,
                    data: item.products.map((product: any) => ({
                        image: getImageUrl(product.imageParams[0]),
                        title: product.name,
                        description: product.description,
                        price: parseInt(product.price) || 0,
                    }))
                }));
                setProductSuggestions(refinedData);
                setConversation((prev) => {
                    const lastMessage = prev[prev.length - 1];
                    if (lastMessage.role === "ai") {
                        return [...prev.slice(0, -1), { ...lastMessage, productData: refinedData as unknown as ProductItem[] }];
                    }
                    return [...prev, { role: "ai", message: "", productData: refinedData as unknown as ProductItem[] }];
                });
            }
        };

        const handleNoProduct = (data: { message: string }) => {
            setNotificationText(data.message);
        };

        socket?.on("message", handleMessage);
        socket?.on("chatName", handleChatName);
        socket?.on("status", handleStatus);
        socket?.on("statusOver", handleStatusOver);
        socket?.on("budgetSlider", handleBudgetSlider);
        socket?.on("intendList", handleIntendList);
        socket?.on("productId", handleProductId);
        socket?.on("noProduct", handleNoProduct);
        socket?.on("terminate", () => {
            setStateOfButton(-1);
            setCurrStreamingRes("");
        });

        return () => {
            socket?.off("message", handleMessage);
            socket?.off("chatName", handleChatName);
            socket?.off("status", handleStatus);
            socket?.off("statusOver", handleStatusOver);
            socket?.off("budgetSlider", handleBudgetSlider);
            socket?.off("intendList", handleIntendList);
            socket?.off("productId", handleProductId);
            socket?.off("noProduct", handleNoProduct);
        };
    };

    useEffect(() => {
        async function fetchHistory() {
            const isFetchAllowed = localStorage.getItem('retrieveChat') === "yes";
            if (!isNew && isFetchAllowed) {
                setIsLoadingHistory(true);
                const chatData = await fetchChatHistory(sessionId, userData?.id, pagination);
                const memoryData = await fetchCurrentMateyMemoryStatus(sessionId);
                if (!memoryData.success) {
                    toast({
                        title: "Error",
                        description: memoryData.message,
                        variant: "destructive",
                    });
                    setIsError(true);
                } else {
                    setIsMateyMemory(memoryData.data.isMateyMemoryOn);
                }
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
                    ? [...prev.slice(0, -1), { ...prev[prev.length - 1], message: currStreamingRes }]
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
                console.log("senting user message ------------------", { sessionId, message: initialMessage, userId });
                socket.emit("userMessage", { sessionId, message: initialMessage, userId });
            }
            searchParams.delete("new");
            setSearchParams(searchParams);
            localStorage.removeItem('userPrompt');
        }

        const cleanup = handleSocketEvents();

        return () => {
            cleanup();
            localStorage.setItem('retrieveChat', "yes");
            setProductSuggestions([]);
            setBreakpoints([]);
        };
    }, [socket, isNew, userData, sessionId, searchParams, setSearchParams]);

    useEffect(scrollToBottom, [conversation]);

    const handleUserPrompt = () => {
        setConversation([...conversation, { role: "user", message: mainInput }]);
        const userMessage = {
            sessionId,
            message: mainInput,
            userId,
            isBudgetSliderPresent: userData?.planAccess[2] ? breakpoints.length > 0 : undefined,
            budgetSliderValue: userData?.planAccess[2] ? sliderValue : undefined,
        };
        console.log("senting user message -", userMessage);
        socket?.emit("userMessage", userMessage);

    };

    const handleMateyMemory = async () => {
        console.log("changing memory status");
        setIsMateyMemory((prev) => !prev);
        const res = await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/v1/changeMemoryStatus`, {
            userStatus: !isMateyMemory,
            sessionId
        });

        if (res.status === 200) {
            toast({
                title: "Success",
                description: res.data.message,
                variant: "success",
            });
        }
    }

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
        <div className={`flex flex-col h-screen py-4 pl-4 ${conversation.length === 1 ? "items-end" : "items-center"}`}>
            <div className="flex-grow overflow-y-scroll max-w-4xl flex flex-col gap-4 pr-4 relative w-full">
                {conversation.map((data, index) => (
                    <div key={index}>
                        {data.role === "ai" ? (
                            <Aichat
                                workerQueue={data.workQueue}
                                message={data.message.replace("Typing...", "")}
                                productData={data.productData}
                            />
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
                                <Tooltip delayDuration={0}>
                                    <TooltipTrigger>
                                        <Switch
                                            checked={isMateyMemory}
                                            onCheckedChange={() => handleMateyMemory()}
                                            defaultChecked={true}
                                            className="data-[state=checked]:bg-lightOrange data-[state=unchecked]:bg-slate-400"
                                        />
                                    </TooltipTrigger>
                                    <TooltipContent className="border-2 border-orange shadow-lg">
                                        <div className="flex flex-col gap-2">
                                            <p className="font-semibold text-lightOrange text-left">Add to Matey Memory - {isMateyMemory ? "On" : "Off"}</p>
                                            <Separator orientation="vertical" className="border border-lightOrange w-full" />
                                            <div className="max-w-sm text-left flex flex-col gap-2">
                                                <p className="font-semibold">
                                                    When On, Matey will remember this conversation to give better suggestions in future chats.
                                                </p>
                                                <p>{isMateyMemory ? "Turn Off if you don't want Matey to remember this chat" : "Turn On if you do want Matey to remember this chat"}</p>
                                            </div>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
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




