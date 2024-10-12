import { useContext, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"

// import {
//     Accordion,
//     AccordionContent,
//     AccordionItem,
//     AccordionTrigger,
// } from "@/components/ui/accordion"

// import {
//     Card,
//     CardContent,
// } from "@/components/ui/card"
import { RightSidebarContext } from '@/context/rightSidebarContext';
import { Box, ChevronRight } from 'lucide-react';
import { ToolbarLabel } from './ToolbarLabel';

export function ProductSuggestion() {
    const [isHovered, setIsHovered] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const { productSuggestions } = useContext(RightSidebarContext);
    return (
        <div>
            <ToolbarLabel name="Product Suggestions" icon={<Box />}/>
           <div className='grid grid-cols-2 gap-1'>
           {
                productSuggestions.map((product, index) => (
                    <div
                        onMouseEnter={() => {
                            setIsHovered(true)
                            setActiveIndex(index)
                        }}
                        className='p-2 bg-slate-200 rounded-md cursor-pointer '
                    >
                        {product.name}
                    </div>
                ))
            }
           </div>




            <motion.div
                onMouseLeave={() => setIsHovered(false)}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.5 }}
                transition={{ duration: 0.3 }}
                className={`absolute top-14 right-[415px] bg-slate-200 rounded-md flex justify-center items-center ${isHovered ? 'hidden' : 'block'}`}
                style={{ width: '800px', height: '350px' }}
            >
                {
                    activeIndex !== -1 && (
                        <div>
                            <Carousel>
                                <CarouselContent>
                                    {
                                        productSuggestions[activeIndex].data.map((product,index) => (
                                            <CarouselItem key={index} className='basis-1/2 w-fit h-fit'>
                                                <ProductCard product={product} />
                                            </CarouselItem>
                                        ))
                                    }
                                </CarouselContent>
                                <CarouselPrevious />
                                <CarouselNext />
                            </Carousel>
                        </div>
                    )
                }
            </motion.div>
            
        </div>
    );
}


const ProductCard = ({ product }) => (
    <div className="w-[250px] flex-shrink-0 border rounded-lg p-4 flex flex-col">
        <div className="bg-gray-200 w-full h-40 mb-4"></div>
        <h3 className="font-semibold">{product.name}</h3>
        <p className="text-sm text-gray-600 mb-2">{product.description}</p>
        <p className="font-semibold mb-2">{product.price}</p>
        <a href="#" className="text-sm text-blue-600 hover:underline mt-auto inline-flex items-center">
            View Details <ChevronRight className="w-4 h-4 ml-1" />
        </a>
    </div>
)
