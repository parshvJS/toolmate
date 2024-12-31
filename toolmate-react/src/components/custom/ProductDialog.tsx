import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, PackageOpen, Pickaxe, Store } from "lucide-react"
import { useEffect, useState, useRef, useContext } from "react"
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Checkbox } from "@/components/ui/checkbox"

import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"
import axios from "axios"
import { useQuery } from "@tanstack/react-query"
import {
    Card,
    CardContent,
    CardHeader,
} from "@/components/ui/card"
import { SlidersHorizontal } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { getBunningsFilterData } from "@/lib/utils"
import { IBunningProduct, IBunningsFilter } from "@/types/types"
import { RightSidebarContext } from "@/context/rightSidebarContext"

/* Simple local cache to store category -> products data */
const bunningsCache: Record<string, any> = {}

type IActiveDash = "products" | "filter" | "details" | "filterProduct"

type IProduct = {
    categoryName: string
    products: any[]
}



type IVendorFilter = {
    price: [number, number]
    isOfferAvailable: boolean
}

type IMateyProductFilter = {
    price: [number, number]
}

type IProductDialogProps = {
    bunningsProduct?: IProduct[]
    vendorProduct?: IProduct[]
    mateyMadeProduct?: IProduct[]
    isOpen: boolean
    setIsOpen: (open: boolean) => void
}

const throttle = (func: (...args: any[]) => void, limit: number) => {
    let inThrottle = false
    return function (this: any, ...args: any[]) {
        if (!inThrottle) {
            func.apply(this, args)
            inThrottle = true
            setTimeout(() => (inThrottle = false), limit)
        }
    }
}

export default function ProductDialog({
    bunningsProduct,
    vendorProduct,
    mateyMadeProduct,
    isOpen,
    setIsOpen,
}: IProductDialogProps) {
    const [activeDash, setActiveDash] = useState<IActiveDash>("products")
    const [activeTab, setActiveTab] = useState<string>(
        bunningsProduct
            ? "bunnings"
            : vendorProduct
                ? "vendor"
                : mateyMadeProduct
                    ? "matey-made"
                    : "bunnings"
    )
    const [selectedCategory, setSelectedCategory] = useState<string | null>(
        bunningsProduct
            ? bunningsProduct[0].categoryName
            : vendorProduct
                ? vendorProduct[0].categoryName
                : mateyMadeProduct
                    ? mateyMadeProduct[0].categoryName
                    : null
    )
    const [isBunningsDataLoading, setIsBunningsDataLoading] =
        useState<boolean>(false)
    const [isBunningsDataError, setIsBunningsDataError] = useState<boolean>(false)
    const [BunningsDataError, setBunningsDataError] = useState<string>("")
    const [bunningsData, setBunningsData] = useState<any>(null)
    const [allBunningsData, setAllBunningsData] = useState<any>(null)
    const [isImageLoading, setImageLoading] = useState<boolean>(true)
    const [bunningsFilter, setBunningsFilter] = useState<IBunningsFilter>({
        price: [0, 0],
        brands: [],
        isTopBrand: false,
        newArrival: false,
        bestSeller: false,
    })
    const [currentFilter, setCurrentFilter] = useState<IBunningsFilter | null>(null)
    const {
        setItemNumberToBunnings,
        getItemFromBunningsCache
    } = useContext(RightSidebarContext)
    /* Throttled function */
    const throttledGetBunningsData = throttle(getBunningsData, 2000)

    const { data: cachedData } = useQuery({
        queryKey: ["bunningsData", selectedCategory],
        queryFn: throttledGetBunningsData,
        enabled: !!selectedCategory,
        staleTime: 5 * 60 * 1000,
    })

    // get filter data
    useEffect(() => {
        console.log("chekcing bunningsData", bunningsData)
        if (bunningsData) {
            const filterData = getBunningsFilterData(bunningsData, bunningsFilter)
            console.log(filterData, "is here filter ");
            setBunningsFilter({
                ...filterData,
                price: filterData.price as [number, number]
            })
        }
    }, [bunningsData])

    // data will come from component filter
    function onBunningsFilter(filterData: IBunningsFilter) {
        console.log(filterData, "sdfsdcds");
        if (!filterData) return
        setCurrentFilter(filterData)
        setActiveDash("filterProduct")
    }

    async function getBunningsData() {
        if (!bunningsProduct || !selectedCategory) return;
        const itemMap = bunningsProduct.find(
            (product) => product.categoryName === selectedCategory
        );
        if (!itemMap) return;

        /* Build a simple cache key from the category or its products */
        const cacheKey = `bunnings-${selectedCategory}`;
        if (bunningsCache[cacheKey]) {
            setBunningsData(bunningsCache[cacheKey]);
            setBunningsFilter(getBunningsFilterData(bunningsCache[cacheKey], bunningsFilter))
            return bunningsCache[cacheKey];
        }

        setIsBunningsDataLoading(true);
        try {
            let cachedProducts = [];
            let uncachedItemNumbers = [];

            // Check cache for each itemNumber
            for (const itemNumber of itemMap.products) {
                const cachedProduct = getItemFromBunningsCache(itemNumber);
                if (cachedProduct) {
                    cachedProducts.push(cachedProduct);
                } else {
                    uncachedItemNumbers.push(itemNumber);
                }
            }

            // If all products are cached, use them directly
            if (uncachedItemNumbers.length === 0) {
                setBunningsData(cachedProducts);
                setBunningsFilter(getBunningsFilterData(cachedProducts, bunningsFilter))
                return cachedProducts;
            }

            // Fetch uncached products from API
            const response = await axios.post(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/getBunningsProductFromItemMap`,
                { itemMap: [{ categoryName: selectedCategory, products: uncachedItemNumbers }] }
            );

            if (response.data.data) {
                const apiProducts = response.data.data[0].products;
                bunningsCache[cacheKey] = [...cachedProducts, ...apiProducts];
                setBunningsData(bunningsCache[cacheKey]);
                const filterData = getBunningsFilterData([...cachedProducts, ...apiProducts], bunningsFilter)
                console.log(filterData, "is here filter ");
                setBunningsFilter(filterData)
                setAllBunningsData((prev: any) => {
                    if (prev) {
                        return [...prev, ...cachedProducts, ...apiProducts]
                    }
                    return [...cachedProducts, ...apiProducts]
                })          // Update the cache with the new products
                apiProducts.forEach((product: any) => {
                    setItemNumberToBunnings(product.itemNumber, product);
                });
                return bunningsCache[cacheKey];
            }
        } catch (error: any) {
            setIsBunningsDataError(true);
            setBunningsDataError(error.message);
        } finally {
            setIsBunningsDataLoading(false);
        }
    }




    useEffect(() => {
        if (cachedData) {
            setBunningsData(cachedData)
        }
    }, [cachedData])

    useEffect(() => {
        if (
            bunningsProduct &&
            activeTab === "bunnings" &&
            activeDash === "products" &&
            selectedCategory &&
            selectedCategory.length > 0
        ) {
            if (typeof bunningsProduct[0].products[0] === "string") {
                throttledGetBunningsData()
            }
        }
    }, [bunningsProduct, activeTab, activeDash, selectedCategory])

    useEffect(() => {
        console.log("bunningsProduct:", bunningsProduct)
        console.log("vendorProduct:", vendorProduct)
        console.log("mateyMadeProduct:", mateyMadeProduct)

        console.log("isOpen:", isOpen)
    }, [
        bunningsProduct,
        vendorProduct,
        mateyMadeProduct,

        isOpen,
    ])
    useEffect(() => {
        if (!bunningsData) return
        {
        }
    }, [bunningsData])
    const onCategoryChange = (category: string) => {
        setSelectedCategory(category)
    }
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="h-[calc(100%-10rem)] lg:max-w-screen-xl max-w-screen-lg md:max-w-screen-md sm:max-w-screen-sm p-0 overflow-y-scroll hide-scrollbar">
                <div className="w-full h-full p-4">
                    {/* heading */}
                    <div className="flex w-full">
                        <Tabs
                            defaultValue="bunnings"
                            className="w-full h-full"
                            onValueChange={(value) => {
                                setActiveDash("products")
                                setActiveTab(value)
                                console.log("value:", value)
                            }}
                        >
                            <div className="flex gap-2 items-center w-full h-full">
                                <TabsList className="bg-slate-300 text-black rounded-md  flex gap-1">
                                    <TabsTrigger
                                        value="bunnings"
                                        className="data-[state=active]:bg-yellow flex items-center space-x-2 hover:bg-slate-200"
                                    >
                                        <Store className="w-5 h-5" />
                                        <span>Bunnings Products</span>
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="vendor"
                                        className="data-[state=active]:bg-yellow flex items-center space-x-2 hover:bg-slate-200"
                                    >
                                        <Pickaxe className="w-5 h-5" />
                                        <span>Vendor Store</span>
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="matey-made"
                                        className="data-[state=active]:bg-yellow flex items-center space-x-2 hover:bg-slate-200"
                                    >
                                        <PackageOpen className="w-5 h-5" />
                                        <span>Matey Made Products</span>
                                    </TabsTrigger>
                                </TabsList>
                                <div
                                    onClick={() => {
                                        setActiveTab("")
                                        setActiveDash((prev) => prev === "filter" ? "products" : "filter")
                                    }}
                                    className="bg-slate-200 px-6 py-2 cursor-pointer rounded-md shadow-md flex gap-2 items-center font-semibold text-black hover:bg-slate-300">
                                    <SlidersHorizontal className="w-5 h-5 m-1" />
                                    <p>Filter</p>
                                </div>
                            </div>
                            {activeDash === "filter" ? (
                                <Filter
                                    onFilterApply={onBunningsFilter}
                                    activeDash={activeDash}
                                    setActivedash={setActiveDash}
                                    filterFields={
                                        bunningsFilter ? Object.keys(bunningsFilter) : []
                                    }
                                    bestSeller={bunningsFilter?.bestSeller}
                                    newArrival={bunningsFilter?.newArrival}
                                    brands={bunningsFilter?.brands}
                                    pricing={bunningsFilter?.price}
                                    isTopBrand={bunningsFilter?.isTopBrand}

                                />
                            ) : activeDash === "products" ? (
                                <TabsContent
                                    value="bunnings"
                                    className="rounded-md flex-1 h-full min-h-full"
                                >
                                    <div className="w-full p-2 h-full flex-1 flex rounded-md">
                                        <EmptyProductListFallBack
                                            activeTab="bunnings"
                                            data={bunningsProduct}
                                            component={
                                                <SpeadCategory
                                                    products={bunningsProduct?.map(
                                                        (product) => product.categoryName
                                                    )!}
                                                    onCategoryChange={onCategoryChange}
                                                    activeCategory={selectedCategory}
                                                />
                                            }
                                        />
                                    </div>
                                    {isBunningsDataLoading ? (
                                        <div className="w-full h-full flex-1 mt-20 flex flex-col gap-2 items-center justify-center">
                                            <img
                                                className="animate-pulse rounded-md"
                                                src="/assets/images/bunnings-logo.png"
                                                alt="loading"
                                                width={65}
                                                height={65}
                                            />
                                            <p className="font-semibold text-lg">
                                                Loading Bunnings Products....
                                            </p>
                                        </div>
                                    ) : isBunningsDataError ? (
                                        <div className="w-full h-full flex-1 mt-20 flex flex-col gap-2 items-center justify-center">
                                            <p className="font-semibold text-lg text-red-500">
                                                Error Fetching Bunnings Products
                                            </p>
                                            <p className="text-red-500">{BunningsDataError}</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
                                            {bunningsData &&
                                                bunningsData.map((product: any, index: number) => (
                                                    <ProductCard key={index} product={product} />
                                                ))}
                                        </div>
                                    )}
                                </TabsContent>
                            ) : activeDash === "details" ? (
                                <div></div>
                            ) : activeDash == "filterProduct" && (
                                <div>
                                    <ShowFilteredBunningsProduct
                                        setActiveDash={setActiveDash}
                                        filterList={currentFilter!}
                                        bunningsProduct={allBunningsData}
                                    />
                                </div>
                            )}



                        </Tabs>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function SpeadCategory({
    products,
    onCategoryChange,
    activeCategory,
}: {
    products: string[]
    onCategoryChange: (category: string) => void
    activeCategory: string | null
}) {
    console.log("products:", products)
    return (
        <Carousel className="w-full flex items-center justify-center relative px-2 py-1 rounded-lg ">
            <CarouselPrevious className="absolute left-2 bg-slate-200 hover:bg-slate-300 rounded-full p-2" />
            <div className="mx-12  px-4 py-2 rounded-lg  w-full">
                <CarouselContent className="flex space-x-4">
                    {products.map((product, index) => (
                        <CarouselItem
                            onClick={() => onCategoryChange(product)}
                            key={index}
                            className={`${activeCategory === product ? "bg-lightYellow" : ""
                                } md:basis-1/3 lg:basis-1/5 py-1 rounded-md cursor-pointer`}
                        >
                            <p className="whitespace-nowrap overflow-hidden text-ellipsis font-semibold">
                                {product}
                            </p>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </div>
            <CarouselNext className="absolute right-2 bg-slate-300 hover:bg-slate-400 rounded-full p-2" />
        </Carousel>
    )
}

function EmptyProductListFallBack({
    activeTab,
    component,
    data,
}: {
    activeTab: string
    component: React.ReactNode
    data: any
}) {
    if (activeTab === "bunnings" && data && data.length === 0) {
        return (
            <div className="flex justify-center items-center h-full w-full">
                <div className="flex flex-col items-center justify-center gap-4">
                    <p className="text-slate-500 font-semibold">No products found</p>
                    <p className="text-slate-500">
                        Keep Chating Matey Will Suggest Use full product Soon
                    </p>
                </div>
            </div>
        )
    }

    if (activeTab === "vendor" && data.vendorProduct.length === 0) {
        return (
            <div className="flex justify-center items-center h-full w-full">
                <div className="flex flex-col items-center justify-center gap-4">
                    <p className="text-slate-500 font-semibold">No products found</p>
                    <p className="text-slate-500">
                        Keep Chating Matey Will Suggest Use full product Soon
                    </p>
                </div>
            </div>
        )
    }

    if (activeTab === "matey-made" && data.mateyMadeProduct.length === 0) {
        return (
            <div className="flex justify-center items-center h-full w-full">
                <div className="flex flex-col items-center justify-center gap-4">
                    <p className="text-slate-500 font-semibold">No products found</p>
                    <p className="text-slate-500">
                        Keep Chating Matey Will Suggest Use full product Soon
                    </p>
                </div>
            </div>
        )
    }

    return <div className="w-full">{component}</div>
}



function Filter({
    onFilterApply,
    activeDash,
    setActivedash,
    filterFields = ["pricing"],
    pricing = [5, 150],
    brands,
    isTopBrand,
    newArrival,
    bestSeller,
}: {
    onFilterApply: (filterData: IBunningsFilter) => void
    activeDash: string
    setActivedash: (dash: IActiveDash) => void,
    filterFields?: string[],
    pricing?: [number, number],
    brands?: string[],
    isTopBrand?: boolean,
    newArrival?: boolean,
    bestSeller?: boolean
}) {
    const [currPrice, setCurrPrice] = useState(pricing[0])
    const [selectedBrands, setSelectedBrands] = useState<string[]>(brands ? brands : [])
    const [isTopBrandChecked, setIsTopBrandChecked] = useState<boolean>(false)
    const [isNewArrivalChecked, setIsNewArrivalChecked] = useState<boolean>(false)
    const [isBestSellerChecked, setIsBestSellerChecked] = useState<boolean>(false)

    const handleApplyFilter = () => {
        const filterData: IBunningsFilter = {
            price: [pricing[0], currPrice],
            brands: selectedBrands,
            isTopBrand: isTopBrandChecked,
            newArrival: isNewArrivalChecked,
            bestSeller: isBestSellerChecked,
        }
        console.log(filterData, "is here filter data")
        onFilterApply(filterData)
    }


    useEffect(() => {
        setSelectedBrands(brands ? brands : [])
        setCurrPrice(pricing[1])
    }, [brands])

    return (
        <div className="flex flex-col items-start gap-4 w-full my-4">
            <div
                onClick={() => setActivedash("products")}
                className="flex hover:bg-slate-200 items-center rounded-md gap-2 w-fit bg-slate-300  px-5 py-2 font-semibold">
                <ArrowLeft />
                Back
            </div>
            {filterFields.includes("brands") && (
                <div className="flex items-start  gap-2 w-1/2">
                    <p className="font-semibold text-lg px-4 py-2 bg-slate-200 rounded-md">Brands</p>
                    <div className="flex flex-col gap-2">
                        <ToggleGroup
                            type="multiple"
                            value={selectedBrands}
                            onValueChange={(value) => setSelectedBrands(value)}
                            variant={"outline"}
                            className="grid grid-cols-4"
                        >
                            {
                                brands?.map((brand) => (
                                    <ToggleGroupItem
                                        className="text-ellipsis data-[state=on]:border-black data-[state=on]:bg-yellow"
                                        key={brand}
                                        value={brand}
                                    >
                                        {brand}
                                    </ToggleGroupItem>
                                ))
                            }
                        </ToggleGroup>
                    </div>
                </div>
            )}

            {filterFields.includes("price") && (
                <div className="flex w-1/2 gap-2 items-center">
                    <p className="font-semibold text-lg px-4 py-2 bg-slate-200 rounded-md">Price</p>
                    <div className="flex flex-col gap-2 items-center w-full">
                        <Slider
                            onValueChange={(value) => {
                                setCurrPrice(value[0])
                            }}
                            value={[currPrice]}
                            min={pricing[0]}
                            defaultValue={[33]} max={pricing[1]} step={1} />
                        <div className="flex justify-between w-full">
                            <span>${pricing[0]}</span>
                            <span>${currPrice}</span>
                            <span>${pricing[1]}</span>
                        </div>
                    </div>
                </div>
            )}
            {filterFields.includes("isTopBrand") && (
                <div className="flex gap-2 w-1/2">
                    <p className="font-semibold text-lg px-4 py-2 bg-slate-200 rounded-md w-fit">Top Brands Only</p>
                    <label>
                        <Checkbox className="w-8 h-8" checked={isTopBrandChecked} onCheckedChange={(checked) => setIsTopBrandChecked(checked === true)} />
                    </label>
                </div>
            )}
            {filterFields.includes("newArrival") && (
                <div className="flex items-center gap-2 w-1/2">
                    <p className="font-semibold text-lg px-4 py-2 bg-slate-200 rounded-md w-fit">New Arrival Only</p>
                    <label>
                        <Checkbox className="w-8 h-8" checked={isNewArrivalChecked} onCheckedChange={(checked) => setIsNewArrivalChecked(checked == true)} />
                    </label>
                </div>
            )}
            {filterFields.includes("bestSeller") && (
                <div className="flex items-center gap-2 w-1/2">
                    <p className="font-semibold text-lg px-4 py-2 bg-slate-200 rounded-md w-fit">Best Seller Only</p>
                    <label>
                        <Checkbox className="w-8 h-8" checked={isBestSellerChecked} onCheckedChange={(checked) => setIsBestSellerChecked(checked == true)} />
                    </label>
                </div>
            )}

            <div className="flex gap-2 p-2 bg-slate-200 rounded-md ">
                <button
                    onClick={handleApplyFilter}
                    className="bg-yellow px-10 hover:bg-lightYellow text-black font-semibold py-2 rounded-md">
                    Apply Filter
                </button>
                <button
                    onClick={() => {
                        setCurrPrice(pricing[0])
                        setSelectedBrands([])
                        setIsTopBrandChecked(false)
                        setIsNewArrivalChecked(false)
                        setIsBestSellerChecked(false)
                    }}
                    className="bg-slate-400 px-10 hover:bg-slate-300 text-black font-semibold py-2 rounded-md">
                    Clear Filter
                </button>
            </div>
        </div>

    );
}


function ShowFilteredBunningsProduct({
    setActiveDash,
    filterList,
    bunningsProduct
}: {
    setActiveDash: (dash: IActiveDash) => void,
    filterList: IBunningsFilter, bunningsProduct: IBunningProduct[]
}) {
    console.log(filterList, "is here filterList", bunningsProduct, "is here bunningsProduct")
    if (!bunningsProduct || !filterList) return <div>Can't show products Right not</div>;

    const [filteredProducts, setFilteredProducts] = useState<IBunningProduct[]>(bunningsProduct);

    useEffect(() => {
        const filtered = bunningsProduct.filter((product) => {
            let isFiltered = true;
            if (filterList.brands && filterList.brands.length > 0) {
                console.log(filterList.brands, "is here filterList")
                isFiltered = filterList.brands.map((brand) => product.brand.includes(brand)).includes(true);
            }
            if (filterList.price) {
                isFiltered = isFiltered && product.price.unitPrice <= filterList.price[1]
            }
            if (filterList.isTopBrand) {
                isFiltered = isFiltered && product.bestSeller
            }
            if (filterList.newArrival) {
                isFiltered = isFiltered && product.newArrival
            }
            if (filterList.bestSeller) {
                isFiltered = isFiltered && product.leadingBrand
            }
            return isFiltered;
        })
        console.log(filtered, "is here filteredfff")
        setFilteredProducts(filtered);
    }, [])

    return (
        <div className="p-4 flex-col flex gap-2">

            <div
                onClick={() => setActiveDash("filter")}
                className="flex hover:bg-slate-200 items-center rounded-md gap-2 w-fit bg-slate-300  px-5 py-2 font-semibold">
                <ArrowLeft />
                Back
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 ">
                {filteredProducts.map((product: any, index: number) => (
                    <ProductCard key={index} product={product} />
                ))}
            </div>
        </div>
    )


}

function ProductCard({ product }: { product: any }) {
    const [isImageLoading, setImageLoading] = useState<boolean>(true);
    console.log(product, "is here product----")
    return (
        <Card
            className="transition-transform transform hover:scale-105 shadow-lg rounded-lg overflow-hidden"
        >
            <CardHeader className="p-0">
                <div className="relative w-full h-40">
                    <img
                        src={product.heroImage}
                        alt={product.title}
                        className="w-full h-40 object-cover"
                        onLoad={() => setImageLoading(false)}
                        onError={() => setImageLoading(false)}
                    />
                    {isImageLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                            <span className="loader"></span>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-4">
                <div className="flex flex-col h-full justify-between">
                    <p className="font-semibold text-lg text-slate-800 text-left">
                        {product.title}
                    </p>
                    <p className="text-slate-600 mt-2 text-left">
                        {product.price.unitPrice === product.price.lineUnitPrice
                            ? `$${product.price.unitPrice}`
                            : `$${product.price.unitPrice} - $${product.price.lineUnitPrice}`}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}