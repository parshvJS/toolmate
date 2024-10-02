import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowDownToDot,
  Bolt,
  Box,
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
import { Link, useParams } from "react-router-dom";
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
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import MateyInput from "@/components/custom/MateyInput";
import { Separator } from "@/components/ui/separator";

let socket: Socket;

export default function PreviewChat() {
  const { slug } = useParams()
  console.log(slug, "--------------------------------")
  const toolmateModels = [
    {
      name: "ToolMate Free",
      src: "/assets/icons/wrench.svg",
      activeSrc: "/assets/icons/orangeWrench.svg",
    },
    {
      name: "ToolMate Essential",
      src: "/assets/icons/gear.svg",
      activeSrc: "/assets/icons/orangeGear.svg",
    },
    {
      name: "ToolMate Premium",
      src: "/assets/icons/toolbox.svg",
      activeSrc: "/assets/icons/orangeToolbox.svg",
    },
  ];

  const suggestions = [
    {
      message: "Need inspiration for your next DIY project?",
      iconUrl: "/assets/icons/drill.svg",
    },
    {
      message: "Looking for step-by-step guides?",
      iconUrl: "/assets/icons/wrench1.svg",
    },
    {
      message: "Want to know the best tools for the job?",
      iconUrl: "/assets/icons/paint.svg",
    },
    {
      message: "Need help troubleshooting your project?",
      iconUrl: "/assets/icons/roller.svg",
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

    socket = io(import.meta.env.VITE_SERVER_URL);

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
    if (currentMessage.length === 0) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (currentMessage.length > 0) {
      scrollToBottom();
    }
  }, [currentMessage]);

  useEffect(() => {
    if (userResponse) handleUserPrompt();
  }, [userResponse]);

  return (
    <div
      className={classNames("grid min-h-screen w-screen h-screen md:grid", {
        "md:grid-cols-sidebar": !collapsed,
        "grid-cols-sidebar-collapsed": collapsed,
        "transition-[grid-template-columns] duration-300 ease-in-out": true,
      })}
    >
      <div className="md:mb-0 w-full px-2 py-1 flex items-center bg-white justify-between pb-3 md:hidden fixed z-50 border-b-2 border-yellow shadow-sm">
        <div>
          <LogoSmall />
        </div>

        <div className="text-black font-semibold">
          🌟1/10 Credit
        </div>
        <Sheet>
          <SheetTrigger>
            <div className="w-12 h-12 flex justify-center items-center">
              <img src="/assets/line2.svg" alt="menu" className="w-8 h-8" />
            </div>
          </SheetTrigger>
          <SheetContent side={"left"}>
            <SheetHeader>
              <SheetTitle>Are you absolutely sure?</SheetTitle>
              <SheetDescription>
                <div className="h-full w-full flex gap-1 flex-col">
                  {toolmateModels.map((model, index) => (
                    <div
                      onClick={() => setTempActivePlan(index)}
                      key={index}
                      className={classNames(
                        "bg-slate-200 cursor-pointer border-2 px-3 py-2 flex gap-3 rounded-md min-h-full transition-all duration-300 ease-in-out",
                        {
                          "text-orange": tempActivePlan === index,
                          "border-slate-200": tempActivePlan !== index,
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
              </SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      </div>




      {/* desk top nav */}
      <div
        className={`bg-slate-100 flex ${collapsed ? "items-center" : "items-start"
          }  px-3 items-start flex-col z-50 md:flex hidden`}
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
      <div className="flex md:inset-0 md:mt-0 justify-center overflow-hidden">
        <div className="flex min-w-0 flex-1 flex-col md:min-w-[28rem] lg:min-w-[32rem] justify-between">
          <div className="md:flex hidden bg-background relative z-10 ml-[54px] mr-4 h-16 w-[calc(100%-70px)] shrink-0 items-center justify-between gap-1 px-0 sm:mx-0 sm:h-14 sm:w-full sm:px-4 border-b-2 border-slate-100">
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

          <div className="relative size-full overflow-y-auto p-4  md:mt-0">
            {currentMessage.length === 0 && (
              <div className="text-left text-4xl font-bold my-14">
                <div className="md:hidden">
                  <MateyExpression expression={"tool"} />
                </div>
                <span className="bg-gradient-to-r font-black from-orange to-lightOrange bg-clip-text text-transparent  ">
                  Hello There!
                </span>
                <br />
                <div className="flex flex-md:flex-row items-center gap-5">
                  <p className="text-2xl">Ask Matey About Your Latest DIY Plan</p>
                  <div className="hidden md:block">
                    <MateyExpression expression={"tool"} />
                  </div>
                </div>
                <div>
                  <p className="font-medium text-base md:text-xl text-gray">
                    Share your DIY project ideas with Matey for expert advice!
                  </p>
                </div>
                <div className="mt-12 flex gap-2 overflow-x-auto  py-2 no-scrollbar">
                  {suggestions.map((suggestion, index) => (
                    <div
                      onClick={() => {
                        setUserResponse(true);
                        setMainInput(suggestion.message);
                        handleUserPrompt();
                      }}
                      className="cursor-pointer flex h-[150px] max-w-[190px] md:min-w-[180px] md:max-w-[190px] flex-shrink-0 border-2 border-slate-300 bg-slate-100 bg-gradient-to-bl hover:from-yellow hover:to-white hover:border-yellow p-3 flex-col justify-between rounded-md gap-2 transition-all duration-600 ease-in-out"
                      key={index}
                    >
                      <img
                        src={suggestion.iconUrl}
                        alt="icon"
                        className="w-6 h-6"
                      />
                      <p className="md:w-3/4 md:font-normal text-lg md:text-xs">
                        {suggestion.message}
                      </p>
                    </div>
                  ))}
                </div>


              </div>
            )}

            <div className="mb-24 mt-28">
              {currentMessage.map((message, index) => (
                <div key={index}>
                  {message.role === "ai" ? (
                    <Aichat
                      message={message.message.replace("Typing...", "")}
                    />
                  ) : (
                    <div className="flex items-end gap-2 justify-end w-full my-1">
                      <p className="border-orange border-2 px-3 md:px-7 py-2 rounded-md bg-lightOrange">
                        {message.message}
                      </p>
                    </div>
                  )}
                </div>
              ))}
              {currentMessage.length !== 0 && isShowingUpsell && (
                <div className="bg-gradient-to-br from-ligherYellow via-white to-white p-5 ml-2 md:ml-10 ease-in-out opacity-100 gap-2 border-2 border-yellow hover:border-yellow w-fit rounded-md cursor-pointer">
                  <div className="flex items-start gap-4 mb-2">
                    <img
                      src="/assets/icons/lock.svg"
                      alt="lock"
                      width={20}
                    />
                    <div className="text-left">
                      <p className="font-bold">Get ToolMate Premium</p>
                      <ul className="text-left text-xs md:text-sm">
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
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="fixed md:sticky bottom-0 inset-x-0 md:mb-5 m-2 flex flex-col items-center bg-transparent">
            <div className="w-full flex gap-0 border-2 bg-slate-100 border-lightOrange rounded-lg flex-col">
              <textarea
                value={mainInput}
                onChange={(e) => setMainInput(e.target.value)}
                placeholder="Give Your Idea To Matey."
                className=" w-full rounded-t-lg rounded-b-none pr-12 bg-slate-50 outline-none focus:outline-none focus:ring-0 placeholder-slate-900 text-slate-900 transition-all duration-1000 ease-in-out"
                rows={isExpanded ? 9 : 3}
                style={{ transition: "height 0.3s ease-in-out" }}
              />
              <div className="p-2 h-14 border-t-2 border-lightOrange justify-between items-center w-full flex space-x-2">
                <div className="bg-transparent">
                  <MateyExpression expression={mateyExpression} />
                </div>
                <div className="flex gap-4 md:gap-4 items-center">

                  <div className="block w-full h-full md:hidden">
                    <Drawer>
                      <DrawerTrigger>
                        <div className={`${showStreamingState ? "gradient-animation" : ""} p-1 rounded-full w-9 h-9 flex items-center justify-center`}>
                          <Box className="cursor-pointer text-slate-600" />
                        </div>
                      </DrawerTrigger>
                      <DrawerContent>
                        <div >
                          <ToolSuggestion
                            isDropdownOpen={isDropdownOpen}
                            setDropDown={setIsDropdownOpen}
                            defaultDropdownMessage={`-Garden Guru\n- FixIt Friends\n- Artisan's Choice\n- Sew Simple\n- Project Planner\n- Sew Simple\n- Project Planner`}
                            message={`-Garden Guru\n- FixIt Friends\n- Artisan's Choice\n- Sew Simple\n- Project Planner\n- Sew Simple\n- Project Planner`}
                            giveStreamingEffect={showStreamingState}
                            isDropdownTyping={true}
                            isInDrawer={true}
                          />
                        </div>
                      </DrawerContent>
                    </Drawer>

                  </div>
                  <Separator orientation="vertical" className="border border-slate-500 h-8" />
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
