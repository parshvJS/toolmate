import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState, useRef, useContext } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { RightSidebarContext } from "@/context/rightSidebarContext";
import { Component, Grid2x2Plus, ListCollapse, Loader, Package } from "lucide-react";

export default function Aichat(
  { workerQueue, message, productData, bunningsData, aiData, isProductLoading, isBunningLoading, isAiProductLoading }:
    {
      workerQueue: string[] | undefined;
      message: string;
      productData: any;
      bunningsData: any
      aiData: any,
      isProductLoading: boolean,
      isBunningLoading: boolean,
      isAiProductLoading: boolean
    }
) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [showWorkerQueue, setShowWorkerQueue] = useState(false);
  const [productRendered, setProductRendered] = useState(true);
  const { productSuggestions } = useContext(RightSidebarContext);
  const messageRef = useRef(message);

  useEffect(() => {
    const handleStreaming = () => {
      setIsStreaming(true);
      setShowWorkerQueue(false);
      clearTimeout(messageRef.current);
      messageRef.current = setTimeout(() => {
        setIsStreaming(false);
        if (productRendered) {
          setShowWorkerQueue(true);
        }
      }, 1000);
    };

    handleStreaming();
  }, [message, productRendered]);

  useEffect(() => {
    if ((workerQueue?.length || 0) > 0 && workerQueue?.includes("Recommended useful products")) {
      setProductRendered(false);
    }
  }, [workerQueue]);

  useEffect(() => {
    if (productData?.length > 0) {
      setProductRendered(true);
    }
  }, [productData])

  return (
    <div className="flex flex-col w-fit">
      <div className="flex items-start gap-2 justify-start">
        {/* Chat Icon */}
        {/* {showExpression(expresion)} */}
        <img src="/assets/icons/blur-ball.svg" alt="matey" width={45} />
        {/* Message Box */}
        <div className="font-roboto custom-p flex flex-col w-fit bg-gray-100 p-3 rounded-md">
          {(message == "" || !message) ? (
            <div className="flex flex-col gap-4 w-full">
              {/* line 1 */}
              <div className="flex gap-3 w-full">
                <Skeleton className="h-4 w-[420px] bg-ligherYellow" />
                <Skeleton className="h-4 w-[220px] bg-ligherYellow" />
                <Skeleton className="h-4 w-[80px] bg-ligherYellow" />
                <Skeleton className="h-4 w-[330px] bg-ligherYellow" />
              </div>
              {/* line 2 */}
              <div className="flex gap-3 w-full">
                <Skeleton className="h-4 w-[220px] bg-ligherYellow" />
                <Skeleton className="h-4 w-[80px] bg-ligherYellow" />
                <Skeleton className="h-4 w-[420px] bg-ligherYellow " />
                <Skeleton className="h-4 w-[330px] bg-ligherYellow " />
              </div>
            </div>
          ) : (
            <Markdown
              remarkPlugins={[remarkGfm]}
              className="text-black text-left"
            >
              {message}
            </Markdown>
          )}

          {/* events */}
          {
            (isProductLoading || isBunningLoading || isAiProductLoading) &&
            <div className="bg-slate-200 border border-slate-400 w-fit h-16 mt-2 flex items-center rounded-md overflow-hidden cursor-pointer hover:bg-slate-300 group">
              <div className="flex items-center justify-center bg-softYellow border-r-[1px] border-slate-400 w-16 z-10 h-16 flex-1 group-hover:bg-lightYellow">
                <Loader className="animate-spin " />
              </div>
              <div className="p-4 flex flex-col text-left">
                <p className="font-semibold text-slate-700">Matey Is Preparing The Products For You</p>
                <p className="font-semibold text-slate-500">Loading Product ...</p>
              </div>
            </div>
          }

          {

          }

        </div>
      </div>
      {/* <div className="w-[100px]">
        <GetPremium />
      </div> */}
    </div>
  );
}

