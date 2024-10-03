import Aichat from "@/components/custom/Aichat";
import { useSocket } from "@/context/socketContext";
import { UserContext } from "@/context/userContext";
import { useContext, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import MateyExpression from "../../../components/custom/MateyExpression";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { ArrowDownToDot, ExpandIcon, Send, LoaderPinwheel } from "lucide-react";

interface Message {
    role: string;
    message: string;
}

export function ChatPage() {
    const [conversation, setConversation] = useState<Message[]>([
        // {
        //     role: "user",
        //     message: localStorage.getItem('userPrompt') || "Hey Matey!"
        // }
    ]);
    const [currStreamingRes, setCurrStreamingRes] = useState("");
    const { sessionId } = useParams<{ sessionId: string }>();
    const socket = useSocket();
    const { userData, unshiftSidebarItem } = useContext(UserContext);
    const [searchParams, setSearchParams] = useSearchParams();
    const isNew = Boolean(searchParams.get("new"));

    // State for the input area
    const [mainInput, setMainInput] = useState("");
    const [isExpanded, setIsExpanded] = useState(false);
    const [mateyExpression, setMateyExpression] = useState("");
    const [stateOfButton, setStateOfButton] = useState(-1);

    // Ref for the chat container to enable auto-scrolling
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    // Function to scroll to the bottom of the chat
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        // Handle streaming responses from the server
        if (currStreamingRes !== "") {
            const lastConversationItem = conversation[conversation.length - 1];

            // Check if last item is already AI's and update only if new
            if (lastConversationItem?.role === "ai") {
                const newConversation = conversation.slice(0, -1); // Exclude the last incomplete item
                setConversation([...newConversation, { role: "ai", message: currStreamingRes }]);
            } else {
                // Append new response if no AI response exists
                setConversation([...conversation, { role: "ai", message: currStreamingRes }]);
            }
        }
    }, [currStreamingRes]);

    useEffect(() => {
        console.log("Component mounted");

        // Perform initial conversation setup if 'new' is in the URL
        if (isNew) {
            console.log("Handling first response as new user");

            const initialMessage = localStorage.getItem('userPrompt') || "Hey Matey!";

            // Add the user's initial message to the conversation
            setConversation((prevData) => [
                ...prevData,
                {
                    role: "user",
                    message: initialMessage,
                },
            ]);

            // Emit the initial message to the server
            if (socket && userData) {
                console.log("creating new chat name")
                socket.emit("getChatName", {
                    prompt: initialMessage,
                    sessionId: sessionId,
                    userId: userData?.id,
                });

                socket.emit("userMessage", {
                    sessionId: sessionId,
                    message: initialMessage,
                });
                socket.on('chatName', (data) => {
                    console.log("chatname", data);
                    unshiftSidebarItem({
                        chatName: data.chatName,
                        sessionId: data.sessionId
                    })
                })
            }

            // Remove 'new' parameter from URL after the initial operation
            searchParams.delete("new");
            setSearchParams(searchParams); // Update the URL
            localStorage.removeItem('userPrompt');
        }

        // Listen for server responses
        const handleMessage = (data: { text: string }) => {
            setCurrStreamingRes((prevData) => prevData + data.text); // Append the new data to the streaming response
        };

        socket?.on("message", handleMessage);

        // Cleanup to avoid duplicate listeners
        return () => {
            socket?.off("message", handleMessage);
        };
    }, [socket, isNew, userData, sessionId, searchParams, setSearchParams]);

    // Automatically scroll to the bottom when the conversation updates
    useEffect(() => {
        scrollToBottom();
    }, [conversation]);

    const handleUserPrompt = () => {


        console.log("User prompt submitted:", mainInput);
        const newConversation = [...conversation, { role: "user", message: mainInput }];
        setConversation(newConversation);
        socket?.emit("userMessage", {
            sessionId: sessionId,
            message: mainInput,
        })
        // Handle user prompt submission
    };

    return (
        <div className="p-6 flex flex-col h-screen">
            <div className="flex-grow overflow-auto">
                {conversation.map((data: Message, index) => (
                    <div key={index}>
                        {data.role === "ai" ? (
                            <Aichat message={data.message.replace("Typing...", "")} />
                        ) : (
                            <div className="w-full flex justify-end">
                                <div className="flex w-fit justify-end px-3 py-2 bg-yellow rounded-md">
                                    {data.message}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                {/* Empty div to reference for scrolling */}
                <div ref={messagesEndRef} />
            </div>
            <div className="w-full flex gap-0 border-2 bg-slate-100 border-lightOrange mt-2 rounded-lg flex-col">
                <textarea
                    value={mainInput}
                    onChange={(e) => setMainInput(e.target.value)}
                    placeholder="Give Your Idea To Matey."
                    className="w-full rounded-t-lg rounded-b-none pr-12 bg-slate-50 outline-none focus:outline-none focus:ring-0 placeholder-slate-900 text-slate-900 transition-all duration-1000 ease-in-out"
                    rows={isExpanded ? 9 : 3}
                    style={{ transition: "height 0.3s ease-in-out" }}
                />
                <div className="p-2 h-14 border-t-2 border-lightOrange justify-between items-center w-full flex space-x-2">
                    <div className="bg-transparent">
                        <MateyExpression expression={mateyExpression} />
                    </div>
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
                            disabled={stateOfButton === 0 ? true : false}
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

