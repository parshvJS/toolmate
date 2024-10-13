import { useContext, useState } from 'react';
import { motion } from 'framer-motion';

import { RightSidebarContext } from '@/context/rightSidebarContext';
import { ArrowRight, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from '../ui/scroll-area';

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Separator } from '../ui/separator';

export function ProductSuggestion({
    isMateyOpen
}: {
    isMateyOpen: boolean
}) {
    const [activeIndex, setActiveIndex] = useState(-1);
    const { productSuggestions } = useContext(RightSidebarContext);
    const [productDropdown, setProductDropdown] = useState(false);
    return (
        <div>
                        <Separator className='border border-slate-200 my-2' />

            <div className='flex w-full'>
                <DropdownMenu open={productDropdown} onOpenChange={() => { setProductDropdown(!productDropdown) }}>

                    <DropdownMenuTrigger className='w-full px-1'>
                        <div className='w-full border-2 p-2 rounded-md bg-slate-100 border-slate-200 hover:bg-slate-200 flex justify-between'>
                            <div className='flex gap-2 items-center'>
                                <div className='font-semibold'>
                                    Tool Suggestion Category
                                </div>
                            </div>
                            <div>
                                {
                                    productDropdown ? <ChevronRight /> : <ChevronLeft />
                                }
                            </div>
                        </div>

                    </DropdownMenuTrigger>
                    <DropdownMenuContent side='left' className='mt-12 w-full'>
                        <div
                            onClick={() => {
                                setActiveIndex(-1)
                                setProductDropdown(false)
                            }}
                            className='px-2 py-1 w-64 bg-slate-100 rounded-md text-left hover:bg-paleYellow cursor-pointer font-semibold'
                        >
                            All Tools
                            <div className='font-medium text-slate-500'>
                                {productSuggestions.reduce((acc, curr) => acc + curr.data.length, 0)} Tools
                            </div>
                        </div>
                        <div className='grid gap-1'>
                            {
                                productSuggestions.map((product, index) => (
                                    <div
                                        key={index}
                                        onClick={() => {
                                            setActiveIndex(index)
                                            setProductDropdown(false)
                                        }}
                                        className='px-2 py-1 w-64 bg-slate-100 rounded-md text-left hover:bg-paleYellow cursor-pointer font-semibold'
                                    >
                                        {product.name}
                                        <div className='font-medium text-slate-500'>
                                            {product.data.length} Tools
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>


                {/* open whole dialog  */}
                <TooltipProvider delayDuration={0}>
                    <Tooltip>
                        <TooltipTrigger>
                            <div className='p-2 border-2 border-l-slate-200 rounded-md mr-1 bg-slate-100 hover:bg-slate-200'>
                                <ExternalLink />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side='left'>
                            <p>All Tool Suggestions</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            <Separator className='border border-slate-200 mt-2' />

            <ScrollArea className={`overflow-hidden  mt-3 w-full rounded-md ${isMateyOpen ? "lg:h-[calc(100vh-30rem)] h-[calc(100vh-20rem)]" : "lg:h-[calc(100vh-12rem)] h-[calc(100vh-8rem)]"}`}>
                <div className='flex gap-1 flex-col p-1'>

                    {
                        activeIndex === -1 ? (
                            productSuggestions.map((product) => (
                                product.data.map((product, index) => (
                                    <div>
                                        <motion.div
                                            key={index}
                                            className='w-full cursor-pointer hover:bg-slate-200 flex items-center gap-2 px-2 py-3'
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <div>
                                                <img src={product.image} alt={product.title} className='w-20 h-20 rounded-md' />
                                            </div>
                                            <div className='flex items-start flex-col justify-between w-full'>
                                                <div className='text-sm font-bold'>{product.title}</div>
                                                <div className='text-xs text-left text-slate-600'>
                                                    {product.description.length > 36 ? product.description.slice(0, 36) + '...' : product.description}
                                                </div>
                                                <div className='flex gap-2 items-center justify-between w-full'>
                                                    <div className='text-xs text-slate-500'>{product.price} $</div>
                                                    <div className='text-slate-800 flex'>
                                                        View Details <ArrowRight width={14} />
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                        <Separator className='border border-slate-200' />


                                    </div>

                                ))
                            ))
                        ) : (
                            productSuggestions[activeIndex]?.data.map((product, index) => (
                                <div>
                                    <motion.div
                                        key={index}
                                        className='w-full cursor-pointer hover:bg-slate-200 flex items-center gap-2 px-2 py-3'
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <div>
                                            <img src={product.image} alt={product.title} className='w-20 h-20 rounded-md' />
                                        </div>
                                        <div className='flex items-start flex-col justify-between w-full'>
                                            <div className='text-sm font-bold'>{product.title}</div>
                                            <div className='text-xs text-left text-slate-600'>
                                                {product.description.length > 36 ? product.description.slice(0, 36) + '...' : product.description}
                                            </div>
                                            <div className='flex gap-2 items-center justify-between w-full'>
                                                <div className='text-xs text-slate-500'>{product.price} $</div>
                                                <div className='text-slate-800 flex'>
                                                    View Details <ArrowRight width={14} />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                    <Separator className='border border-slate-200' />


                                </div>
                            ))
                        )
                    }
                </div>
            </ScrollArea>
        </div>

    )
}