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

export interface ProductGroup {
  categoryName: string;
  products: any[];
}

interface RightSidebarContextProps {
  sliderValue: number;
  isBudgetOn: boolean;
  breakpoints: Breakpoint[];
  vendorProduct: ProductGroup[];
  bunningProduct: ProductGroup[];
  aiProduct: ProductGroup[];
  notification: number;
  totalProductSuggestions: number;
  isSliderBreakPointEmpty: boolean;
  setSliderValue: (value: number) => void;
  setIsBudgetOn: (value: boolean) => void;
  setBreakpoints: (breakpoints: Breakpoint[]) => void;
  massAddVendor: (products: ProductGroup[]) => void;
  massAddAi: (products: ProductGroup[]) => void;
  massAddBunnings: (products: ProductGroup[]) => void;
  appendVendor: (products: ProductGroup[]) => void;
  appendAi: (products: ProductGroup[]) => void;
  appendBunnings: (products: ProductGroup[]) => void;
  notificationRemove: () => void;
  clearAllTool: () => void;
}

const INITIAL_RIGHT_SIDEBAR_CONTEXT: RightSidebarContextProps = {
  sliderValue: 500,
  isBudgetOn: false,
  breakpoints: [],
  vendorProduct: [],
  bunningProduct: [],
  aiProduct: [],
  notification: 0,
  totalProductSuggestions: 0,
  isSliderBreakPointEmpty: true,
  setSliderValue: () => { },
  setIsBudgetOn: () => { },
  setBreakpoints: () => { },
  massAddVendor: () => { },
  massAddAi: () => { },
  massAddBunnings: () => { },
  appendVendor: () => { },
  appendAi: () => { },
  appendBunnings: () => { },
  notificationRemove: () => { },
  clearAllTool: () => { }
};

export const RightSidebarContext = createContext<RightSidebarContextProps>(INITIAL_RIGHT_SIDEBAR_CONTEXT);

export const RightSidebarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sliderValue, setSliderValue] = useState<number>(INITIAL_RIGHT_SIDEBAR_CONTEXT.sliderValue);
  const [isBudgetOn, setIsBudgetOn] = useState<boolean>(INITIAL_RIGHT_SIDEBAR_CONTEXT.isBudgetOn);
  const [breakpoints, setBreakpoints] = useState<Breakpoint[]>(INITIAL_RIGHT_SIDEBAR_CONTEXT.breakpoints);
  const [vendorProduct, setVendorProduct] = useState<ProductGroup[]>([]);
  const [bunningProduct, setBunningProduct] = useState<ProductGroup[]>([]);
  const [aiProduct, setAiProduct] = useState<ProductGroup[]>([]);
  const [notification, setNotification] = useState<number>(0);
  const [totalProductSuggestions, setTotalProductSuggestions] = useState<number>(0);

  // Calculate the total number of product suggestions
  const calculateTotalProductSuggestions = () => {
    console.log('calculateTotalProductSuggestions', vendorProduct, bunningProduct, aiProduct);
    const total =
      vendorProduct.reduce((acc, group) => acc + (group.products.length || 0), 0) +
      bunningProduct.reduce((acc, group) => acc + (group.products.length || 0), 0) +
      aiProduct.reduce((acc, group) => acc + (group.products.length || 0), 0);
    setTotalProductSuggestions(total);
  };

  // Functions to mass add products
  const massAddVendor = (products: ProductGroup[]) => {
    setVendorProduct(products);
  };

  const massAddAi = (products: ProductGroup[]) => {
    setAiProduct(products);
  };

  const massAddBunnings = (products: ProductGroup[]) => {
    setBunningProduct(products);
  };

  // Functions to append products
  const appendVendor = (products: ProductGroup[]) => {
    setVendorProduct((prev) => [...prev, ...products]);
    setNotification((prev) => prev + products.length);
    calculateTotalProductSuggestions();

  };

  const appendAi = (products: ProductGroup[]) => {
    setAiProduct((prev) => [...prev, ...products]);
    setNotification((prev) => prev + products.length);
    calculateTotalProductSuggestions();

  };

  const appendBunnings = (products: ProductGroup[]) => {
    setBunningProduct((prev) => [...prev, ...products]);
    setNotification((prev) => prev + products.length);
    calculateTotalProductSuggestions();

  };
  useEffect(() => {
    console.log('RightSidebarProvider state:', {
      sliderValue,
      isBudgetOn,
      breakpoints,
      vendorProduct,
      bunningProduct,
      aiProduct,
      notification,
      totalProductSuggestions
    });
  }, [isBudgetOn, sliderValue, breakpoints, vendorProduct, bunningProduct, aiProduct, notification, totalProductSuggestions]);
  // Function to reset notification count
  const notificationRemove = () => {
    setNotification(0);
  };
  useEffect(() => {

    calculateTotalProductSuggestions();
  }, [vendorProduct, bunningProduct, aiProduct]);

  function clearAllTool(){
    setSliderValue(INITIAL_RIGHT_SIDEBAR_CONTEXT.sliderValue);
    setIsBudgetOn(INITIAL_RIGHT_SIDEBAR_CONTEXT.isBudgetOn);
    setBreakpoints(INITIAL_RIGHT_SIDEBAR_CONTEXT.breakpoints);
    setVendorProduct([]);
    setBunningProduct([]);
    setAiProduct([]);
    setNotification(INITIAL_RIGHT_SIDEBAR_CONTEXT.notification);
    setTotalProductSuggestions(INITIAL_RIGHT_SIDEBAR_CONTEXT.totalProductSuggestions);
    console.log('RightSidebarProvider unmounted');
  }

  useEffect(() => {
    console.log('RightSidebarProvider mounted', sliderValue, isBudgetOn, breakpoints, vendorProduct, bunningProduct, aiProduct, notification, totalProductSuggestions);
  }, [isBudgetOn, sliderValue, breakpoints, vendorProduct, bunningProduct, aiProduct, notification, totalProductSuggestions]);

  return (
    <RightSidebarContext.Provider
      value={{
        sliderValue,
        isBudgetOn,
        breakpoints,
        vendorProduct,
        bunningProduct,
        aiProduct,
        notification,
        totalProductSuggestions,
        isSliderBreakPointEmpty: breakpoints.length === 0,
        setSliderValue,
        setIsBudgetOn,
        setBreakpoints,
        massAddVendor,
        massAddAi,
        massAddBunnings,
        appendVendor,
        appendAi,
        appendBunnings,
        notificationRemove,
        clearAllTool
      }}
    >
      {children}
    </RightSidebarContext.Provider>
  );
};
