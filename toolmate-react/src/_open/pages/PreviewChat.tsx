import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowDownToDot,
  Bolt,
  Check,
  ChevronsUpDown,
  Columns2,
  ExpandIcon,
  LoaderPinwheel,
  Send,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

import io, { Socket } from "socket.io-client";
import { ExpressionData, IChat } from "@/types/types";
import classNames from "classnames";
import ButtonCustom from "@/components/custom/ButtonCustom";
import LogoSmall from "@/components/custom/LogoSmall";
import DarkLogo from "@/components/custom/DarkLogo";
import Aichat from "@/components/custom/Aichat";
import MateyExpression from "@/components/custom/MateyExpression";
import ToolSuggestion from "@/components/custom/ToolSuggestion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

let socket: Socket;

export default function PreviewChat() {
  const toolmateModels = [
    {
      name: "ToolMate Free",
      src: "/public/assets/icons/wrench.svg",
      activeSrc: "/public/assets/icons/orangeWrench.svg",
    },
    {
      name: "ToolMate Essential",
      src: "/public/assets/icons/gear.svg",
      activeSrc: "/public/assets/icons/orangeGear.svg",
    },
    {
      name: "ToolMate Premium",
      src: "/public/assets/icons/toolbox.svg",
      activeSrc: "/public/assets/icons/orangeToolbox.svg",
    },
  ];

  const suggestions = [
    {
      message: "Need inspiration for your next DIY project?",
      iconUrl: "/public/assets/icons/drill.svg",
    },
    {
      message: "Looking for step-by-step guides?",
      iconUrl: "/public/assets/icons/wrench1.svg",
    },
    {
      message: "Want to know the best tools for the job?",
      iconUrl: "/public/assets/icons/paint.svg",
    },
    {
      message: "Need help troubleshooting your project?",
      iconUrl: "/public/assets/icons/roller.svg",
    },
  ];

  const [isExpanded, setIsExpanded] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(true);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const [isShowingUpsell, setIsShowingUpsell] = useState(false);
  const [tempActivePlan, setTempActivePlan] = useState(0);
  const [showStreamingState, setShowStreamingState] = useState(false);
  const [mainInput, setMainInput] = useState("");
  const [stateOfButton, setStateOfButton] = useState(-1);
  const [currentMessage, setCurrentMessage] = useState<IChat[]>([]);
  const [mateyExpression, setMateyExpression] = useState("laugh");
  const [isToolSuggestionOpenable, setIsToolSuggestionOpenable] =
    useState(false);
  const [userResponse, setUserResponse] = useState<boolean>(false);
  const [collapsed, setSidebarCollapsed] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [credits, setCredits] = useState([1, 2]);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const maxCredits = 5;
  useEffect(() => {
    if (socket) {
      socket.disconnect();
    }

    socket = io("http://localhost:5000");

    const handleConnect = () => console.log("Socket connected");
    const handleAcknowledgement = (data: { sessionId: string }) =>
      localStorage.setItem("sessionId", data.sessionId);
    const handleExpression = (data: ExpressionData) => {
      setCurrentMessage((prev) => {
        const updatedMessages = [...prev];
        updatedMessages.pop();
        updatedMessages.push({ role: "ai", message: "Typing..." });
        return updatedMessages;
      });
      setMateyExpression(data.kwargs.content);
    };
    const handleMessage = (data: { text?: string; done?: boolean }) => {
      if (data.text) {
        setShowStreamingState(true);
        setIsDropdownOpen(true);
        setCurrentMessage((prev) => {
          const updatedMessages = [...prev];
          const lastMessageIndex = prev.length - 1;
          updatedMessages[lastMessageIndex] = {
            ...updatedMessages[lastMessageIndex],
            message: prev[lastMessageIndex].message + data.text,
          };
          return updatedMessages;
        });
      }
    };
    const handleTerminate = () => {
      setStateOfButton(-1);
      setIsShowingUpsell(true);
      setTimeout(() => setIsDropdownOpen(false), 7000);
      setTimeout(() => setShowStreamingState(false), 5000);
    };

    socket.on("connect", handleConnect);
    socket.on("acknowledgement", handleAcknowledgement);
    socket.on("expression", handleExpression);
    socket.on("message", handleMessage);
    socket.on("terminate", handleTerminate);

    return () => {
      localStorage.removeItem("sessionId");
      socket.off("connect", handleConnect);
      socket.off("acknowledgement", handleAcknowledgement);
      socket.off("expression", handleExpression);
      socket.off("message", handleMessage);
      socket.off("terminate", handleTerminate);
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    socket.emit("createSession", "create session");
  }, []);

  useEffect(() => {
    const handleInput = () => {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.style.height = "auto";
        textarea.style.height = `${Math.min(
          textarea.scrollHeight,
          5 * parseFloat(getComputedStyle(textarea).lineHeight)
        )}px`;
      }
    };

    handleInput();
    textareaRef.current?.addEventListener("input", handleInput);

    return () => textareaRef.current?.removeEventListener("input", handleInput);
  }, []);

  const handleUserPrompt = useCallback(
    (e?: React.MouseEvent<HTMLButtonElement>) => {
      setIsShowingUpsell(false);
      e?.preventDefault();
      if (mainInput === "") return;

      setStateOfButton(0);
      const prevMessages = [
        ...currentMessage,
        { role: "user", expression: "", message: mainInput },
        { role: "ai", expression: "tool", message: "Typing..." },
      ];
      setCurrentMessage(prevMessages);

      socket.emit("message", {
        prompt: mainInput,
        sessionId: localStorage.getItem("sessionId"),
      });

      setMainInput("");
      if (currentMessage.length > 3) setIsToolSuggestionOpenable(true);
    },
    [mainInput, currentMessage]
  );

  // hide the scroll bar
  useEffect(() => {
    document.body.style.overflow = "hidden";
    window.scrollTo(0, 0);
    return () => {
      document.body.style.overflow = "scroll";
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentMessage]);

  useEffect(() => {
    if (userResponse) handleUserPrompt();
  }, [userResponse]);

  return (
    <div
      className={classNames("grid min-h-screen  w-screen h-screen", {
        "grid-cols-sidebar": !collapsed,
        "grid-cols-sidebar-collapsed": collapsed,
        "transition-[grid-template-columns] duration-300 ease-in-out": true,
      })}
    >
      <div
        className={`bg-slate-100 flex ${collapsed ? "items-center" : "items-start"
          }  px-3 items-start flex-col z-50`}
      >
        <div className={`flex mt-5 ${!collapsed ? "-ml-3" : "ml-0"} `}>
          {!collapsed ? <DarkLogo /> : <LogoSmall />}
        </div>
        <div className="mt-7">
          <hr className="border border-slate-300 my-3" />
          {/* tool suggestion */}
          {collapsed ? (
            <div className="flex gap-1 flex-col transition-all duration-300 ease-in-out">
              {toolmateModels.map((model, index) => (
                <div
                  className={classNames(
                    "flex justify-center items-center font-semibold rounded-md px-2 py-3 cursor-pointer transition-all duration-200 ease-in-out",
                    {
                      "bg-lightOrange": tempActivePlan === index,
                      "hover:bg-lightOrange bg-slate-200":
                        tempActivePlan !== index,
                    }
                  )}
                  onClick={() => setTempActivePlan(index)}
                  key={index}
                >
                  <img
                    src={tempActivePlan === index ? model.src : model.activeSrc}
                    width={20}
                    className="text-slate-500"
                  />
                </div>
              ))}
              <hr className="border border-slate-300 my-3" />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <div
                      onClick={() => {
                        setSidebarCollapsed(false);
                        setIsDropdownOpen(true);
                      }}
                      className="p-2 rounded-md hover:bg-slate-100 transition-all duration-300 ease-in-out"
                    >
                      <Bolt />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" color="yellow">
                    <p className="text-xs">
                      {showStreamingState
                        ? "Matey is Typing Product Suggestions...."
                        : "Tool Suggestion By Matey"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          ) : (
            <div className="overflow-hidden">
              {/* different models of toolmate */}
              <div className="my-2 flex flex-col items-start">
                <p className="font-semibold text-lg my-2">Featured Models</p>

                {/* models */}
                <div className="h-full w-full flex gap-1 flex-col">
                  {toolmateModels.map((model, index) => (
                    <div
                      onClick={() => setTempActivePlan(index)}
                      key={index}
                      className={classNames(
                        "bg-slate-200 cursor-pointer border-2  px-3 py-2 flex gap-3 rounded-md min-h-full transition-all duration-300 ease-in-out",
                        {
                          " text-orange ": tempActivePlan === index,
                          " border-slate-200": tempActivePlan !== index,
                        }
                      )}
                    >
                      <img
                        src={
                          tempActivePlan === index ? model.activeSrc : model.src
                        }
                        width={20}
                        className={classNames({
                          "text-orange": tempActivePlan === index,
                          "text-slate-500": tempActivePlan !== index,
                        })}
                      />
                      <p className="font-semibold text-md">{model.name}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-7">
                <hr className="border border-slate-300 mb-3" />

                {/* tool suggestion */}
                <p className="font-semibold text-lg text-left my-2">
                  Project Tool Suggestions
                </p>

                <ToolSuggestion
                  isDropdownOpen={
                    isToolSuggestionOpenable ? isDropdownOpen : false
                  }
                  setDropDown={setIsDropdownOpen}
                  defaultDropdownMessage={`-Garden Guru\n- FixIt Friends\n- Artisan's Choice\n- Sew Simple\n- Project Planner\n- Sew Simple\n- Project Planner`}
                  message={`-Garden Guru\n- FixIt Friends\n- Artisan's Choice\n- Sew Simple\n- Project Planner\n- Sew Simple\n- Project Planner`}
                  giveStreamingEffect={showStreamingState}
                  isDropdownTyping={true}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="inset-0 flex justify-center overflow-hidden">
        <div className="flex min-w-0 flex-1 flex-col md:min-w-[28rem] lg:min-w-[32rem]">
          <div className="bg-background relative z-10 ml-[54px] mr-4 flex h-16 w-[calc(100%-70px)] shrink-0 items-center justify-between gap-1 px-0 sm:mx-0 sm:h-14 sm:w-full sm:px-4 border-b-2 border-slate-100">
            <div className="flex justify-between w-full">
              <button
                className="hover:bg-slate-300 p-2 rounded-md"
                onClick={() => setSidebarCollapsed((prev) => !prev)}
              >
                <Columns2 className="w-6 h-6 text-black" />
              </button>

              <div className="flex justify-center items-center text-slate-600 font-semibold">
                ⭐1/10 Free Credit
              </div>
              <ButtonCustom
                navigator="/"
                isArrow={true}
                size="small"
                text="Back To Home"
                isDark={false}
              />
            </div>
          </div>

          <div className="relative size-full overflow-y-auto p-4">
            {currentMessage.length === 0 && (
              <div className="text-left text-4xl font-bold">
                <span className="bg-gradient-to-r font-black from-orange to-lightOrange bg-clip-text text-transparent">
                  Hello There !
                </span>
                <br />
                <div className="flex items-center gap-5">
                  <p>Ask Matey About Your Latest DIY Plan</p>
                  <MateyExpression expression={"tool"} />
                </div>
                <div>
                  <p className="font-medium text-xl text-gray">
                    Share your DIY project ideas with Matey for expert advice!
                  </p>
                </div>
                <div className="mt-12 flex gap-2 flex-wrap">
                  {suggestions.map((suggestion, index) => (
                    <div
                      onClick={() => {
                        setUserResponse(true);
                        setMainInput(suggestion.message);
                        handleUserPrompt();
                      }}
                      className="cursor-pointer h-[150px] max-w-[200px] flex border-2 border-slate-300 bg-slate-100 bg-gradient-to-bl hover:from-yellow hover:to-white hover:border-yellow p-3 flex-col justify-between rounded-md gap-2 my-2 transition-all duration-600 ease-in-out"
                      key={index}
                    >
                      <img
                        src={suggestion.iconUrl}
                        alt="icon"
                        className="w-6 h-6"
                      />
                      <p className="w-3/4 font-normal text-xs">
                        {suggestion.message}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div id="scrollToBottom" className="mb-24">
              {currentMessage.map((message, index) => (
                <div key={index}>
                  {message.role === "ai" ? (
                    <Aichat
                      message={message.message.replace("Typing...", "")}
                    />
                  ) : (
                    <div className="flex items-end gap-2 justify-end w-full my-1">
                      <p className="border-orange border-2 px-7 py-2 rounded-md bg-lightOrange">
                        {message.message}
                      </p>
                    </div>
                  )}
                </div>
              ))}
              {currentMessage.length !== 0 && isShowingUpsell && (
                <div className="bg-gradient-to-br from-ligherYellow via-white to-white p-5 ml-10 ease-in-out opacity-100 gap-2 border-2 border-yellow hover:border-yellow w-fit rounded-md cursor-pointer">
                  <div className="flex items-start gap-4 mb-2">
                    <img
                      src="/public/assets/icons/lock.svg"
                      alt="lock"
                      width={20}
                    />
                    <div className="text-left">
                      <p className="font-bold">Get ToolMate Premium</p>
                      <ul className="text-left">
                        <li>
                          Matey Will Provide In-Depth Product Recommendations
                        </li>
                        <li>Matey remembers your past projects!</li>
                        <li>Matey gives Project Specifications And Budgets</li>
                      </ul>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-8">
                    <Button className="hover:bg-slate-600 font-bold">
                      Get ToolMate Pro
                    </Button>
                    <Link to="/price">
                      <a className="hover:text-slate-500 underline font-bold">
                        Check Plans
                      </a>
                    </Link>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </div>

          <div className="sticky inset-x-0 bottom-0 m-2 flex flex-col items-center  bg-transparent">
            {/* scroll to buttom butt */}
            {/* <div
              onClick={scrollToBottom}
              className="cursor-pointer rounded-full p-1 hover:bg-orange flex justify-center items-center absolute left-0 bottom-full border-2 border-orange bg-lightOrange "
            >
              <ArrowDown  width={20} height={20} />
            </div> */}

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
        </div>
      </div>
    </div>
  );
}
