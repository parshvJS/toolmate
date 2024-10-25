import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "../ui/scroll-area";
import { TableOfContents, Timer, Wrench } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";

interface Product {
    name: string;
    price: number;
    assets: string;
}

interface ChatMessage {
    message: string;
    role: "user" | "ai";
    isToolSuggestion?: boolean;
    products?: Product[];
    followUpQuestion?: boolean;
    budgetSlider?: boolean;
    budgetRange?: { min: number; max: number };
    isEnd?: boolean;
}

const chatDemo: ChatMessage[] = [
    { message: "What’s the best tool to hang a picture frame?", role: "user" },
    {
        message: "Based on that, a cordless drill with self-drilling wall anchors would work perfectly for secure and easy installation! 😊",
        role: "ai",
        isToolSuggestion: true,
        products: [
            { name: "Cordless Drill", price: 50, assets: "/assets/images/demo/product2.png" },
            { name: "Self-Drill Wall Anchors", price: 15, assets: "/assets/images/demo/product3.png" }
        ]
    },
    {
        message: "Would you like to set a budget for these tools? I can suggest options that fit your price range!",
        role: "ai",
        budgetSlider: true,
        budgetRange: { min: 10, max: 200 }
    },
    { message: "Sure, let's keep it under $100.", role: "user" },
    {
        message: "Perfect! Here’s a selection within your budget that will work great for your drywall project. 😊 Let me know if you need more options!",
        role: "ai",
        isToolSuggestion: true,
        products: [
            { name: "Basic Cordless Drill", price: 45, assets: "/assets/images/demo/product2.png" },
            { name: "Affordable Hanging Kit", price: 25, assets: "/assets/images/demo/product1.png" }
        ]
    },
    { message: "Thanks for the help!", role: "user" },
    {
        message: "Let's continue in deep. Let Me assist you with your project?",
        role: "ai",
        isEnd: true
    }
];

export function MobileMock() {
    const [currChat, setCurrChat] = useState<ChatMessage[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamingText, setStreamingText] = useState("");
    const scrollAreaRef = useRef<HTMLDivElement | null>(null);
    const [isProcessing, setIsProcessing] = useState(false); // Flag to control flow
    const navigate = useNavigate();
    const scrollToBottomSmoothly = () => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({
                top: scrollAreaRef.current.scrollHeight,
                behavior: "smooth",
            });
        }
    };

    const processChat = async (index: number) => {
        if (index >= chatDemo.length) return;

        const currentMessage = chatDemo[index];
        setIsProcessing(true);

        if (currentMessage.role === "ai") {
            setIsStreaming(true);
            let charIndex = 0;
            while (charIndex < currentMessage.message.length) {
                setStreamingText((prev) => prev + currentMessage.message[charIndex]);
                charIndex++;
                await new Promise((resolve) => setTimeout(resolve, 30)); // Typing speed
            }
            setCurrChat((prev) => [...prev, { ...currentMessage, message: currentMessage.message }]);
            setStreamingText("");
            setIsStreaming(false);
        } else {
            setCurrChat((prev) => [...prev, currentMessage]);
        }

        scrollToBottomSmoothly();

        // Set timeout for next message only after the current one is fully processed
        setTimeout(() => {
            setIsProcessing(false);
            processChat(index + 1); // Process the next message
        }, 1000); // Adjust this delay as needed
    };

    useEffect(() => {
        if (!isProcessing) {
            processChat(currChat.length); // Start from the current chat length
        }
    }, [isProcessing]);

    useEffect(() => {
        scrollToBottomSmoothly();
    }, [currChat]);

    return (
        <div className="w-full h-full flex justify-start items-center mb-5 relative ">
            <div>
                <img src="/assets/matey/bothThumbsUp.svg" alt="back" className="z-0 top-0 left-48 absolute rotate-12" />
            </div>
            <motion.div
                className="absolute bottom-28 z-20 -left-40 flex flex-col gap-4 justify-end items-end"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <motion.div
                    className="flex justify-between gap-3 rounded-full w-fit p-4 h-fit bg-white/50 backdrop-blur-lg border-2 border-yellow"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <Wrench />
                    Tool Recommendations
                </motion.div>
                <motion.div
                    className="flex justify-between gap-3 rounded-full w-fit p-4 h-fit bg-white/70 backdrop-blur-xl border-2 border-yellow"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    <TableOfContents />
                    Step-by-Step Guides
                </motion.div>
                <motion.div
                    className="flex justify-between gap-3 rounded-full w-fit p-4 h-fit bg-white/50 backdrop-blur-xl border-2 border-yellow"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                >
                    <Timer />
                    Save Time on Projects
                </motion.div>
            </motion.div>

            <div ref={scrollAreaRef} className="z-10 ml-28 bg-white w-[330px] h-[550px] mb-10 overflow-scroll hide-scrollbar border-8 p-2 rounded-3xl ">
                <div className="flex flex-col space-y-4 mt-3 mb-60">
                    {currChat.map((chat, index) => (
                        <div
                            key={index}
                            className={`rounded-lg ${chat.role === "ai" ? "text-left" : "text-right bg-softYellow border-2 border-yellow"}`}
                        >
                                <div className="flex gap-2">
                                {chat.role === "ai" ? (
                                    <div className="flex gap-2 items-start">
                                        <img src="/assets/icons/blur-ball.svg" className="min-w-9 -mt-2" />
                                        <p>{chat.message}</p>
                                    </div>
                                ) : (
                                    <motion.p
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ duration: 0.2 }}
                                        className="p-1 bg-lightYellow rounded-lg"
                                    >
                                        {chat.message}
                                    </motion.p>
                                )}
                            </div>
                            {chat.isToolSuggestion && (
                                <motion.div
                                    className="mt-2 bg-paleYellow border-2 border-yellow rounded-lg p-2"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.6 }}
                                >
                                    <div className="flex gap-2 mb-2">
                                        <img src="/assets/icons/Tick.svg" alt="tick" className="w-5 h-5" />
                                        <p className="font-semibold">Material Suggestions</p>
                                    </div>
                                    <div className="flex gap-3">
                                        {chat.products?.map((product, idx) => (
                                            <motion.div
                                                key={idx}
                                                className="flex flex-col"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 1.2, delay: idx * 0.2 }}
                                            >
                                                <img src={product.assets} alt={product.name} className="border-2 border-yellow rounded-lg" />
                                                <p className="font-semibold text-darkYellow text-[4px]">{product.name}</p>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                          {chat.budgetSlider && (
                                <motion.div
                                    className="mt-2 bg-paleYellow border-2 border-yellow rounded-lg p-2"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <div className="flex gap-2 mb-2">
                                        <img src="/assets/icons/Tick.svg" alt="tick" className="w-5 h-5" />
                                        <p className="font-semibold">Budget Selection</p>
                                    </div>
                                    <div className="flex gap-2 my-4">
                                        <p>Material Budget •</p>
                                        <p className="font-semibold">{chat.budgetRange?.min} - {chat.budgetRange?.max} USD</p>
                                    </div>
                                    <Slider defaultValue={[50]} min={chat.budgetRange?.min} max={chat.budgetRange?.max} />
                                </motion.div>
                            )}
                        </div>
                    ))}
                               {isStreaming && (
                        <div className="p-2 rounded-lg flex items-start gap-2 text-left">
                            <img src="/assets/icons/blur-ball.svg" className="min-w-9" />
                            <p>{streamingText}</p>
                        </div>
                    )}
                </div>

                {/* CTA for 'isEnd' */}
                {currChat.some(chat => chat.isEnd) && (
                    <div className="flex justify-center mt-4 w-full">
                        <motion.button
                            onClick={()=>navigate('/preview')}
                            className="px-4 py-2 w-full bg-yellow hover:bg-softYellow text-black rounded-lg font-semibold hover:bg-yellow-600 transition-all"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            Start A Chat With Matey 
                        </motion.button>
                    </div>
                )}
            </div>
        </div>
    );
}
