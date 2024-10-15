import React, { createContext, useState, ReactNode, useEffect } from 'react';

interface Breakpoint {
  value: number;
  label: string;
  tooltip: string;
}

interface ProductSuggestionItem {
  image: string;
  title: string;
  description: string;
  price: number;
}
interface ProductSuggestion {
  id: number,
  name: string,
  data: ProductSuggestionItem[]
}
interface RightSidebarContextProps {
  sliderValue: number;
  isBudgetOn: boolean;
  breakpoints: Breakpoint[];
  productSuggestions: ProductSuggestion[];
  isSliderBreakPointEmpty: boolean;
  productSuggestionEmpty: boolean;
  setSliderValue: (value: number) => void;
  setIsBudgetOn: (value: boolean) => void;
  setBreakpoints: (breakpoints: Breakpoint[]) => void;
  setProductSuggestions: (suggestions: ProductSuggestion[]) => void;
}
const INITIAL_RIGHT_SIDEBAR_CONTEXT: RightSidebarContextProps = {
  sliderValue: 500,
  isBudgetOn: false,
  breakpoints: [
    { value: 500, label: 'Low', tooltip: 'Budget-friendly products' },
    { value: 1000, label: 'Medium', tooltip: 'Mid-range products' },
    { value: 2000, label: 'High', tooltip: 'Premium products' }
  ],
  productSuggestions: [
    {
      "id": 1,
      "name": "DIY Tools",
      "data": [
        {
          "image": "https://picsum.photos/seed/1/300/200",
          "title": "Power Drill",
          "description": "A powerful cordless drill for all your DIY needs.",
          "price": 120.00
        },
        {
          "image": "https://picsum.photos/seed/2/300/200",
          "title": "Hammer",
          "description": "A durable hammer designed for heavy-duty tasks.",
          "price": 20.00
        },
        {
          "image": "https://picsum.photos/seed/3/300/200",
          "title": "Screwdriver Set",
          "description": "A complete set of screwdrivers for precision work.",
          "price": 35.00
        },
        {
          "image": "https://picsum.photos/seed/4/300/200",
          "title": "Tape Measure",
          "description": "A 25-foot tape measure with a durable lock mechanism.",
          "price": 15.00
        }
      ]
    },
    {
      "id": 2,
      "name": "DIY Materials",
      "data": [
        {
          "image": "https://picsum.photos/seed/5/300/200",
          "title": "Wood Planks",
          "description": "High-quality wood planks for building and crafting.",
          "price": 50.00
        },
        {
          "image": "https://picsum.photos/seed/6/300/200",
          "title": "Paint Set",
          "description": "A set of acrylic paints with various color options.",
          "price": 25.00
        }
      ]
    },
    {
      "id": 3,
      "name": "DIY Gadgets",
      "data": [
        {
          "image": "https://picsum.photos/seed/7/300/200",
          "title": "Laser Level",
          "description": "A high-precision laser level for accurate measurements.",
          "price": 60.00
        },
        {
          "image": "https://picsum.photos/seed/8/300/200",
          "title": "3D Printer",
          "description": "A beginner-friendly 3D printer for DIY enthusiasts.",
          "price": 300.00
        }
      ]
    }
  ]
  ,
  isSliderBreakPointEmpty: true,
  productSuggestionEmpty: true,
  setSliderValue: () => { },
  setIsBudgetOn: () => { },
  setBreakpoints: () => { },
  setProductSuggestions: () => { },
};

export const RightSidebarContext = createContext<RightSidebarContextProps>(INITIAL_RIGHT_SIDEBAR_CONTEXT);

export const RightSidebarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sliderValue, setSliderValue] = useState<number>(0);
  const [isBudgetOn, setIsBudgetOn] = useState<boolean>(true);
  const [breakpoints, setBreakpoints] = useState<Breakpoint[]>(INITIAL_RIGHT_SIDEBAR_CONTEXT.breakpoints);
  const [productSuggestions, setProductSuggestions] = useState<ProductSuggestion[]>(INITIAL_RIGHT_SIDEBAR_CONTEXT.productSuggestions);
  const [isSliderBreakPointEmpty, setIsSliderBreakPointEmpty] = useState<boolean>(true);
  const [productSuggestionEmpty, setProductSuggestionEmpty] = useState<boolean>(true);

  useEffect(() => {
    setIsSliderBreakPointEmpty(breakpoints.length === 0);
  }, [breakpoints]);

  useEffect(() => {
    setProductSuggestionEmpty(productSuggestions.length === 0);
  }, [productSuggestions]);
  useEffect(() => {

    console.log('RightSidebarProvider mounted')
  }, [])
  return (
    <RightSidebarContext.Provider
      value={{
        sliderValue,
        isBudgetOn,
        breakpoints,
        productSuggestions,
        isSliderBreakPointEmpty,
        productSuggestionEmpty,
        setSliderValue,
        setIsBudgetOn,
        setBreakpoints,
        setProductSuggestions,
      }}
    >
      {children}
    </RightSidebarContext.Provider>
  );
};





