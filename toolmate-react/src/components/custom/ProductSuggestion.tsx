import { useContext, useState } from 'react';
import { motion } from 'framer-motion';

import { RightSidebarContext } from '@/context/rightSidebarContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from '../ui/scroll-area';

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
            <ScrollArea className={`${isMateyOpen ? "h-[calc(100vh-29rem)]" : "h-[calc(100vh-12rem)]"} mt-3 w-full rounded-md`}>
                <div className='flex gap-1 flex-col p-1'>
                    {
                        activeIndex === -1 ? (
                            productSuggestions.map((product) => (
                                product.data.map((product, index) => (
                                    <motion.div
                                        key={index}
                                        className='w-full cursor-pointer min-h-full hover:bg-slate-200 flex items-center gap-2 px-2 py-2'
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <div>
                                            <img src={product.image} alt={product.title} className='w-20 h-20 rounded-md' />
                                        </div>
                                        <div className='flex items-start flex-col justify-between'>
                                            <div className='text-sm font-bold'>{product.title}</div>
                                            <div className='text-xs text-left text-slate-600'>
                                                {product.description.length > 30 ? product.description.slice(0, 35) + '...' : product.description}
                                            </div>
                                            <div className='text-xs text-slate-500'>{product.price} $</div>
                                        </div>
                                    </motion.div>
                                ))
                            ))
                        ) : (
                            productSuggestions[activeIndex]?.data.map((product, index) => (
                                <motion.div
                                    key={index}
                                    className='w-full cursor-pointer min-h-full hover:bg-slate-200 flex items-center gap-2 px-2 py-3'
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div>
                                        <img src={product.image} alt={product.title} className='w-20 h-20 rounded-md' />
                                    </div>
                                    <div className='flex items-start flex-col h-full justify-between'>
                                        <div className='text-sm font-bold'>{product.title}</div>
                                        <div className='text-xs text-left text-slate-600'>
                                            {product.description.length > 35 ? product.description.slice(0, 35) + '...' : product.description}
                                        </div>
                                        <div className='text-xs text-slate-500'>{product.price} $</div>
                                    </div>
                                </motion.div>
                            ))
                        )
                    }
                </div>
            </ScrollArea>
        </div>

    )
}