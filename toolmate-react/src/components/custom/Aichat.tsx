import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState, useRef, useContext } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { RightSidebarContext } from "@/context/rightSidebarContext";
import { Boxes, Component, Disc3, Grid2x2Plus, ListCollapse, Loader, Package, PackageOpen } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Separator } from "../ui/separator";
import { Navigate } from "react-router-dom";
import { ScrollArea } from "../ui/scroll-area";
import { getImageUrl } from "@/lib/utils";

export default function Aichat(
  { id, workerQueue, message, productData, bunningsData, aiData, isCurrFeatureLoading, isProductLoading, isBunningLoading, isAiProductLoading }:
    {
      id: string | number | undefined;
      workerQueue: string[] | undefined;
      message: string;
      productData: any;
      bunningsData: any
      aiData: any,
      isCurrFeatureLoading: boolean,
      isProductLoading: boolean,
      isBunningLoading: boolean,
      isAiProductLoading: boolean
    }
) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [showWorkerQueue, setShowWorkerQueue] = useState(false);
  const [productRendered, setProductRendered] = useState(true);
  const { productSuggestions } = useContext(RightSidebarContext);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [currActiveDialog, setCurrActiveDialog] = useState(id);
  const [currDialogActiveTab, setCurrDialogActiveTab] = useState("bunnings");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

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
  {
    const totalProducts = bunningsData.reduce((count, category) => count + category.products.length, 0);
    console.log(totalProducts);


  }
  console.log("productData", productData);

  return (
    <div className="flex flex-col w-fit">
      <div className="flex  items-start gap-2 justify-start">
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
          {/* <div className="flex gap-2 flex-wrap w-full items-center">

            {
              (isCurrFeatureLoading && (isBunningLoading)) &&
              <div className="bg-slate-200 border border-slate-400 w-fit h-16 flex items-center rounded-md overflow-hidden cursor-pointer hover:bg-slate-300 duration-150 group">
                <div className="flex items-center justify-center bg-teal-700 border-r-[1px] border-slate-400 w-16 z-10 h-16 flex-1 group-hover:bg-teal-700/80">
                  <Disc3 className="animate-spin text-black" />
                </div>
                <div className="p-4 flex flex-col text-left">
                  <p className="font-semibold text-slate-700">Matey Is Finding Materials and Tools In Bunnings</p>
                  <p className="font-thin text-slate-500">Loading Product ...</p>
                </div>
              </div>
            }
            {
              (isCurrFeatureLoading && isProductLoading) &&
              <div className="bg-slate-200 border border-slate-400 w-fit h-16 flex items-center rounded-md overflow-hidden cursor-pointer hover:bg-slate-300 duration-150 group">
                <div className="flex items-center justify-center bg-purple-400 border-r-[1px] border-slate-400 w-16 z-10 h-16 flex-1 group-hover:bg-purple-400/80">
                  <Disc3 className="animate-spin text-black" />
                </div>
                <div className="p-4 flex flex-col text-left">
                  <p className="font-semibold text-slate-700">Matey Is Finding Products From Vendors</p>
                  <p className="font-semibold text-slate-500">Loading Product ...</p>
                </div>
              </div>
            }
            {
              (isCurrFeatureLoading && (isAiProductLoading)) &&
              <div className="bg-slate-200 border border-slate-400 w-fit h-16 flex items-center rounded-md overflow-hidden cursor-pointer hover:bg-slate-300 duration-150 group">
                <div className="flex items-center justify-center bg-red-400 border-r-[1px] border-slate-300 w-16 z-10 h-16 flex-1 group-hover:bg-red-400/80">
                  <Disc3 className="animate-spin text-black" />
                </div>
                <div className="p-4 flex flex-col text-left">
                  <p className="font-semibold text-slate-700">Matey Is Preparing Products </p>
                  <p className="font-semibold text-slate-500">Loading Product ...</p>
                </div>
              </div>
            }
          </div> */}

          {/* event data */}
          <div className="flex  gap-2 flex-wrap items-center my-2">
            {
              bunningsData && bunningsData?.length > 0 && (
                <div
                  onClick={() => {
                    setIsProductDialogOpen(!isProductDialogOpen)
                    setCurrActiveDialog(id)
                    setCurrDialogActiveTab("bunnings")
                    if (bunningsData.length > 0) {
                      setSelectedCategory(bunningsData[0].categoryName)
                    }
                  }}
                  className="bg-slate-200 border border-slate-400 w-fit h-16 flex items-center rounded-md overflow-hidden cursor-pointer hover:bg-slate-300 duration-150 group">
                  <div className="flex items-center justify-center bg-white w-16 z-10 h-16 flex-1 bg-cover bg-center" style={{ backgroundImage: "url('/assets/images/bunnings-logo.png')", opacity: 0.8 }}>
                  </div>
                  <div className="p-4 flex flex-col text-left">
                    <p className="font-semibold text-slate-700 md:block hidden">Bunning Material And Products By Matey</p>
                    <p className="font-semibold text-slate-700 md:hidden block">From Bunnings</p>
                    <div className="flex gap-2 items-center w-full">
                      <p className="font-semibold text-slate-500">{bunningsData.length == 1 ? "1 Item" : `${bunningsData.reduce((count, category) => count + category.products.length, 0)} Items`}</p>
                      <div className="w-[5px] h-[5px] rounded-md bg-slate-500 ">
                      </div>
                      <p className="text-slate-500">Click To View</p>

                    </div>
                  </div>
                </div>
              )
            }
            {
              aiData && aiData.length > 0 &&
              <div
                onClick={() => {
                  setIsProductDialogOpen(!isProductDialogOpen)
                  setCurrActiveDialog(id)
                  setCurrDialogActiveTab("aiData")
                  if (aiData.length == 1) {
                    setSelectedCategory(aiData[0].categoryName)
                  }
                }}
                className="bg-slate-200 border border-slate-400 w-fit h-16 flex items-center rounded-md overflow-hidden cursor-pointer hover:bg-slate-300 duration-150 group">
                <div className="flex items-center justify-center bg-purple-400 border-r-[1px] border-slate-400 w-16 z-10 h-16 flex-1 group-hover:bg-purple-400/80">
                  <PackageOpen className="text-white" />
                </div>
                <div className="p-4 flex flex-col text-left">
                  <p className="font-semibold text-slate-700 md:block hidden">Material And Products Prepared By Matey </p>
                  <p className="font-semibold text-slate-700 md:hidden block">Suggestion By Matey </p>
                  <div className="flex gap-2 items-center w-full">
                    <p className="font-semibold text-slate-500">{aiData.length == 1 ? "1 Item" : `${aiData.reduce((count, category) => count + category.products.length, 0)} Items`}</p>
                    <div className="w-[5px] h-[5px] rounded-md bg-slate-500 ">
                    </div>
                    <p className="text-slate-500">Click To View</p>

                  </div>
                </div>
              </div>
            }
            {
              productData && productData.length !== 0 &&
              <div
                onClick={() => {
                  setIsProductDialogOpen(!isProductDialogOpen)
                  setCurrActiveDialog(id)
                  setCurrDialogActiveTab("productData")
                  if (productData.length == 1) {
                    setSelectedCategory(productData[0].categoryName)
                  }
                }}
                className="bg-slate-200 border border-slate-400 w-fit h-16 flex items-center rounded-md overflow-hidden cursor-pointer hover:bg-slate-300 duration-150 group">
                <div className="flex items-center justify-center bg-red-400 border-r-[1px] border-slate-300 w-16 z-10 h-16 flex-1 group-hover:bg-red-400/80">
                  <Boxes className="text-white" />
                </div>
                <div className="p-4 flex flex-col text-left">
                  <p className="font-semibold text-slate-700 md:block hidden">Material And Products Suggestion From Vendor</p>
                  <p className="font-semibold text-slate-700 md:hidden block">Suggestion From Vendor</p>
                  <div className="flex gap-2 items-center">

                    <p className="font-semibold text-slate-500">{productData.length == 1 ? "1 Item" : `${(productData.reduce((count, category) => count + category.products.length, 0) == 0) ? productData.reduce((count, category) => count + category.products.length, 0) : 1} Items`}</p>
                    <div className="w-[5px] h-[5px] rounded-md bg-slate-500 ">
                    </div>
                    <p className="text-slate-500">Click To View</p>
                  </div>

                </div>

              </div>
            }
          </div>

        </div>
      </div>
      <Separator orientation="vertical" className="border border-slate-300 w-full my-2" />




      {
        id == currActiveDialog && (
          <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
            {/* <DialogTrigger>Open</DialogTrigger> */}
            <DialogContent className="h-[calc(100%-10rem)] lg:max-w-screen-lg md:max-w-screen-md sm:max-w-screen-sm p-0">
              <div className="flex">

                <div className=" h-fit w-full flex gap-2 flex-col">
                  <div className="flex gap-2 border-b-2 border-slate-400 p-2">
                    {
                      currDialogActiveTab == "bunnings" && bunningsData && bunningsData.map((category: { categoryName: string, products: any }, inx) => {
                        return (
                          <div
                            key={inx}
                            onClick={() => {
                              setSelectedCategory(category.categoryName)
                            }}
                            className="px-3 py-2 border-2 border-slate-400 rounded-sm hover:bg-yellow hover:border-yellow cursor-pointer transition-colors duration-200"
                          >
                            {category.categoryName}
                          </div>
                        )
                      })
                    }
                    {
                      currDialogActiveTab == "productData" && productData && productData.map((category, inx) => {
                        return (
                          <div
                            key={inx}
                            onClick={() => {
                              setSelectedCategory(category.categoryName)
                            }}
                            className="px-3 py-2 border-2 border-slate-400 rounded-sm hover:bg-yellow hover:border-yellow cursor-pointer transition-colors duration-200"
                          >
                            {category.categoryName}
                          </div>
                        )
                      })
                    }

                    {
                      currDialogActiveTab == "aiData" && aiData && aiData.map((category, inx) => {
                        return (
                          <div
                            key={inx}
                            onClick={() => {
                              setSelectedCategory(category.categoryName)
                            }}
                            className="px-3 py-2 border-2 border-slate-400 rounded-sm hover:bg-yellow hover:border-yellow cursor-pointer transition-colors duration-200"
                          >
                            {category.categoryName}
                          </div>
                        )
                      })
                    }

                  </div>
                  <div className="flex flex-col justify-start items-start">

                    <ScrollArea className="h-[560px] w-full ">
                      <div>

                        {
                          currDialogActiveTab == "bunnings" && bunningsData.map((category, inx) => {
                            const currCategory = selectedCategory === category.categoryName;
                            return (

                              <div
                                key={inx}
                                className={`w-full ${currCategory ? "block" : "hidden"} grid md:grid-cols-3 lg:grid-cols-4 gap-0`}
                              >
                                {
                                  category.products.map((product, index) => {
                                    return (
                                      <a
                                        target="_blank"
                                        key={index}
                                        href={product.link}
                                        className="flex gap-2 flex-col border-slate-400 m-1 ml-2 hover:bg-slate-200 rounded-md p-2"
                                      >
                                        <div className="w-full h-full">
                                          <img
                                            src={product.image}
                                            alt={product.name}
                                            className="w-full h-48 object-cover rounded-lg shadow-lg border-2 border-slate-300 hover:shadow-xl hover:border-slate-500 transition-all duration-150"
                                          />
                                        </div>
                                        <div className="text-left">
                                          <p className="font-semibold text-black">{product.name}</p>
                                          <p className="font-thin text-slate-400">{product.personalUsage}</p>
                                          <p className="font-semibold text-slate-700">{product.price} $</p>
                                        </div>
                                      </a>
                                    )
                                  })
                                }
                              </div>

                            )
                          })
                        }
                        {
                          currDialogActiveTab == "productData" && productData.map((category, inx) => {
                            const currCategory = selectedCategory === category.categoryName;
                            return (
                              <div
                                key={inx}
                                className={`w-full ${currCategory ? "block" : "hidden"} gap-0 grid grid-cols-4`}
                              >
                                {
                                  category.products.map((product, index) => {
                                    return (
                                      <a
                                        target="_blank"
                                        key={index}
                                        href={product.link}
                                        className="flex gap-2 flex-col border-slate-400 m-1 ml-2 hover:bg-slate-200 rounded-md p-2"
                                      >
                                        <div className="w-full h-full">
                                          <img
                                            src={getImageUrl(product.imageParams[0])}
                                            alt={product.name}
                                            className="w-full h-48 object-cover rounded-lg shadow-lg border-2 border-slate-300 hover:shadow-xl hover:border-slate-500 transition-all duration-150"
                                          />
                                        </div>
                                        <div className="text-left">
                                          <p className="font-semibold text-black">{product.name}</p>
                                          <p className="font-thin text-slate-400">{product.description.length > 50 ? product.description.slice(0, 50) + "..." : product.description}</p>
                                          <p className=" text-slate-500 font-semibold">{product.offerDescription}</p>
                                          <p className="font-semibold text-slate-700">{product.price} $</p>
                                        </div>
                                      </a>
                                    )
                                  })
                                }
                              </div>
                            )
                          })
                        }

                        {
                          currDialogActiveTab == "aiData" && aiData.map((category, inx) => {
                            const currCategory = selectedCategory === category.categoryName;
                            return (
                              <div
                                key={inx}
                                className={`w-full ${currCategory ? "block" : "hidden"} grid md:grid-cols-3 lg:grid-cols-4 gap-0`}
                              >
                                {
                                  category.products.map((product, index) => {
                                    return (
                                      <a
                                        target="_blank"
                                        key={index}
                                        href={product.link}
                                        className="flex gap-2 flex-col border cursor-pointer border-slate-400 m-1 ml-2 hover:bg-slate-200 rounded-md p-2"
                                      >
                                        <div className="text-left">
                                          <p className="font-semibold text-black">{product.name}</p>
                                          <p className="font-thin text-slate-400">{product.description}</p>
                                          <p className="font-semibold text-slate-700">{product.price} $</p>
                                          <p className="font-thin text-slate-500">{product.offerDescription}</p>
                                        </div>
                                      </a>
                                    )
                                  })
                                }
                              </div>
                            )
                          })
                        }
                      </div>
                    </ScrollArea>

                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )
      }
      {/* <div className="w-[100px]">
        <GetPremium />
      </div> */}
    </div>
  );
}

