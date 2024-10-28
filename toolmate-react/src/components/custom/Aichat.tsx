import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState, useRef, useContext } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { RightSidebarContext } from "@/context/rightSidebarContext";
import { Component, Grid2x2Plus, ListCollapse } from "lucide-react";

export default function Aichat(
  { workerQueue, message, productData }:
    {
      workerQueue: string[] | undefined;
      message: string;
      productData: any;
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
          <div className="flex gap-0 flex-col">

            <AnimatePresence>
              {productData && (
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 50 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="flex flex-col gap-2 bg-slate-100 my-2 rounded-lg w-fit p-4"
                >
                  {/* label */}
                  <div className="flex items-start gap-2">
                    <img src="/assets/icons/Tick.svg" alt="tick" className="w-6 h-6" />
                    <p className="font-semibold text-lg">Material And Product Suggestion</p>
                  </div>
                  <div className="gap-2 w-full flex">
                    <AnimatePresence>
                      {productData.map((product, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 50 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 50 }}
                          transition={{ duration: 0.3, delay: index * 0.2, ease: "easeOut" }}
                          className="flex h-full flex-col items-start justify-between gap-2 rounded-lg bg-slate-200 hover:bg-slate-300 transition-all duration-200 cursor-pointer p-3 md:w-40"
                        >
                          <div className="text-left">
                            <p className="font-semibold items-start text-left">{product.name}</p>
                            <p className="font-medium">{product.data.length == 1 ? `${product.data.length} Tool` : `${product.data.length} Tools`}</p>
                          </div>
                          <Component className="mt-6 h-5 w-5" />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                  <div className="cursor-pointer p-2 rounded-md bg-slate-100 w-fit flex justify-between items-center gap-3 hover:bg-slate-200 transition-all duration-200">
                    <Grid2x2Plus className="w-5 h-5" />
                    <p>Show All Suggestions In Toolbar</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-2">
              <AnimatePresence>
                {showWorkerQueue && workerQueue?.map((item, index) => (
                  item && (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 50 }}
                      transition={{ duration: 0.3, delay: index * 0.2, ease: "easeOut" }}
                      className="px-2 py-1 rounded-md flex justify-start bg-slate-100 w-fit"
                    >
                      <div className="text-slate-500">
                        {item}
                      </div>
                    </motion.div>
                  )
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
      {/* <div className="w-[100px]">
        <GetPremium />
      </div> */}
    </div>
  );
}

