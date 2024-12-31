import Markdown from "react-markdown";

import remarkGfm from "remark-gfm";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState, useRef, useContext } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Separator } from "../ui/separator";
import { ScrollArea } from "../ui/scroll-area";
import { Boxes, LoaderCircle, PackageOpen } from "lucide-react";
import { getImageUrl } from "@/lib/utils";
import { RightSidebarContext } from "@/context/rightSidebarContext";
import ProductDialog from "./ProductDialog";

interface Product {
  name: string;
  description: string;
  price: string;
  link: string;
  imageParams: string[];
}

interface Category {
  categoryName: string;
  products: any[];
}

interface ProductCardProps {
  product: Product;
  imageUrl: string;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, imageUrl }) => (
  <a
    target="_blank"
    href={product.link}
    className="flex gap-2 flex-col border-slate-400 m-1 ml-2 hover:bg-slate-200 rounded-md p-2"
  >
    <div className="w-full h-full">
      <img
        src={imageUrl}
        alt={product.name}
        className="w-full h-48 object-cover rounded-lg shadow-lg border-2 border-slate-300 hover:shadow-xl hover:border-slate-500 transition-all duration-150"
      />
    </div>
    <div className="text-left">
      <p className="font-semibold text-black">{product.name}</p>
      <p className="font-thin text-slate-400">{product.description}</p>
      <p className="font-semibold text-slate-700">{product.price} $</p>
    </div>
  </a>
);

interface ProductDialogProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  data: Category[];
  selectedCategory: string | null;
  setSelectedCategory: (category: string) => void;
}



interface AichatProps {
  id: string;
  workerQueue: string[] | undefined;
  message: string;
  productData: Category[];
  bunningsData: any;
  aiData: Category[];
  isCurrFeatureLoading: boolean;
  isProductLoading: boolean;
  isBunningLoading: boolean;
  isAiProductLoading: boolean;
}

export default function Aichat({
  id, workerQueue, message, productData, bunningsData, aiData, isCurrFeatureLoading, isProductLoading, isBunningLoading, isAiProductLoading
}: AichatProps) {
  console.log("bunningsData", bunningsData, "isBunningLoading", isBunningLoading)
  const [isStreaming, setIsStreaming] = useState(false);
  const [showWorkerQueue, setShowWorkerQueue] = useState(false);
  const [productRendered, setProductRendered] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const messageRef = useRef<NodeJS.Timeout | null>(null);
  const [isDialogOpen, setDialogOpen] = useState(false);
  useEffect(() => {
    const handleStreaming = () => {
      setIsStreaming(true);
      setShowWorkerQueue(false);
      if (messageRef.current) {
        clearTimeout(messageRef.current);
      }
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
  }, [productData]);

  useEffect(() => {
    let total = 0;
    if (bunningsData) {
      total += bunningsData.reduce((count: any, category: any) => count + category.products.length, 0);
    }
    if (aiData) {
      total += aiData.reduce((count, category) => count + category.products.length, 0);
    }
    if (productData) {
      total += productData.reduce((count, category) => count + category.products.length, 0);
    }
    setTotalProducts(total);
  }, [bunningsData, aiData, productData]);

  console.log("total", totalProducts);
  if (message === "") {
    return null;
  }
  console.log(bunningsData, "kjfssicoic")
  return (
    <div className="flex flex-col w-fit" key={id}>
      <div className="flex items-start gap-2 justify-start">
        <img src="/assets/icons/blur-ball.svg" alt="matey" width={45} />
        <div className="font-roboto custom-p flex flex-col w-fit bg-gray-100 p-3 rounded-md">
          {message === "" ? (
            <div className="flex flex-col gap-4 w-full">
              <div className="flex gap-3 w-full">
                <Skeleton className="h-4 w-[420px] bg-ligherYellow" />
                <Skeleton className="h-4 w-[220px] bg-ligherYellow" />
                <Skeleton className="h-4 w-[80px] bg-ligherYellow" />
                <Skeleton className="h-4 w-[330px] bg-ligherYellow" />
              </div>
              <div className="flex gap-3 w-full">
                <Skeleton className="h-4 w-[220px] bg-ligherYellow" />
                <Skeleton className="h-4 w-[80px] bg-ligherYellow" />
                <Skeleton className="h-4 w-[420px] bg-ligherYellow " />
                <Skeleton className="h-4 w-[330px] bg-ligherYellow " />
              </div>
            </div>
          ) : (
            <Markdown remarkPlugins={[remarkGfm]} className="text-black text-left">
              {message}
            </Markdown>
          )}





          {workerQueue && workerQueue.length > 0 && (
            <div className="flex gap-2 items-center">
              <p className="text-slate-500 font-semibold">Matey Is Working On:</p>
              <div className="flex gap-2 items-center">
                {workerQueue.map((queue, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <p className="text-slate-500 font-semibold">{queue}</p>
                    {index !== workerQueue.length - 1 && <div className="w-[5px] h-[5px] rounded-md bg-slate-500 " />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {
            (isAiProductLoading || isBunningLoading || isProductLoading) && (
              <div
                className="bg-slate-200 border border-slate-400 w-fit h-16 flex items-center rounded-md overflow-hidden cursor-pointer hover:bg-slate-300 duration-150 group mt-3"
              >
                <div className="flex items-center bg-mangoYellow justify-center  w-16 z-10 h-16 flex-1 bg-cover bg-center">

                  <LoaderCircle className="w-8 h-8 flex items-center justify-center animate-spin " />
                </div>

                {/* <div className="flex items-center bg-mangoYellow justify-center  w-16 z-10 h-16 flex-1 bg-cover bg-center" style={{ backgroundImage: "url('/assets/icons/hammer.svg')", opacity: 0.8 }} /> */}
                <div className="p-4 flex flex-col text-left">
                  <p className="font-semibold text-slate-700 md:block hidden">Material And Product Suggestion</p>
                  <p className="font-semibold text-slate-700 md:hidden block">Product Suggestions</p>
                  {
                    totalProducts !== 0 ? (
                      <div className="flex gap-2 items-center w-full ">
                        <p className="font-semibold text-slate-500">{`${totalProducts == 1 ? "1 Item" : `${totalProducts} Items`}`}</p>
                        <div className="w-[5px] h-[5px] rounded-md bg-slate-500 " />
                        <p className="text-slate-500">Click To View</p>
                      </div>
                    ) : (
                      <p className="text-slate-500">Click To View</p>
                    )
                  }
                </div>
              </div>
            )
          }


          {
            (!isBunningLoading && !isProductLoading && !isAiProductLoading && (bunningsData?.length > 0 || productData?.length > 0 || aiData?.length > 0)) && (
              <div
                onClick={() => {
                  setDialogOpen(!isDialogOpen)
                }}
                className="bg-slate-200 border border-slate-400 w-fit h-16 flex items-center rounded-md overflow-hidden cursor-pointer hover:bg-slate-300 duration-150 group mt-3"
              >

                <div className="flex items-center bg-mangoYellow justify-center  w-16 z-10 h-16 flex-1 bg-cover bg-center" style={{ backgroundImage: "url('/assets/icons/hammer.svg')", opacity: 0.8 }} />
                <div className="p-4 flex flex-col text-left">
                  <p className="font-semibold text-slate-700 md:block hidden">Material And Product Suggestion</p>
                  <p className="font-semibold text-slate-700 md:hidden block">Product Suggestions</p>
                  {
                    totalProducts !== 0 ? (
                      <div className="flex gap-2 items-center w-full ">
                        <p className="font-semibold text-slate-500">{`${totalProducts == 1 ? "1 Item" : `${totalProducts} Items`}`}</p>
                        <div className="w-[5px] h-[5px] rounded-md bg-slate-500 " />
                        <p className="text-slate-500">Click To View</p>
                      </div>
                    ) : (
                      <p className="text-slate-500">Click To View</p>
                    )
                  }
                </div>
              </div>
            )
          }
        </div>
      </div>

      <Separator orientation="vertical" className="border border-slate-300 w-full my-2" />
      {
        isDialogOpen && <ProductDialog isOpen={isDialogOpen} setIsOpen={setDialogOpen} bunningsProduct={bunningsData} vendorProduct={productData} mateyMadeProduct={aiData} />
      }
    </div>
  );
}

