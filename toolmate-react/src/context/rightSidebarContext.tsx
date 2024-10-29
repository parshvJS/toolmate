import React, { createContext, useState, ReactNode, useEffect } from 'react';

interface Breakpoint {
  value: number;
  label: string;
  tooltip: string;
}

export interface ProductSuggestionItem {
  image: string;
  title: string;
  description: string;
  price: number;
}
export interface ProductSuggestion {
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
  breakpoints: [],
  productSuggestions: [],
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





