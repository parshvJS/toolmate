import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@radix-ui/react-separator";
import { ArrowRight, Link } from "lucide-react";
import { Button, buttonVariants } from "../ui/button";
import { pricing } from "@/constants";

export default function Price() {
  const [activeTab, setActiveTab] = useState("month");

  const handleTabChange = (value: any) => {
    setActiveTab(value);
  };

  return (
    <Tabs
      defaultValue="month"
      className="w-full my-10 flex flex-col items-center"
      onValueChange={handleTabChange}
    >
      <div className="w-full h-full flex justify-center">
        <TabsList className="bg-slate-100 border-2 border-slate-600 flex md:flex-row flex-col md:w-fit h-full md:h-fit w-full">
          <TabsTrigger
            value="month"
            className={`md:px-14 flex justify-center items-center gap-2 w-full   ${activeTab === "month" ? "bg-gray-200" : ""
              }`}
          >
            <div className="flex justify-between w-full items-center gap-2">
              <p className="text-black">1 Months</p>
              <div className="rounded-full bg-orange text-white px-2"></div>
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="months"
            className={`md:px-14 flex md:justify-center  items-center gap-2 w-full    ${activeTab === "months" ? "bg-gray-200" : ""
              }`}
          >
            <div className="flex justify-between w-full items-center gap-2">
              <p className="text-black">6 Months</p>
              <div className="rounded-full bg-orange text-white px-2">
                15% Off
              </div>
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="year"
            className={`md:px-14 flex md:justify-center  items-center gap-2 w-full    ${activeTab === "year" ? "bg-gray-200" : ""
              }`}
          >
            <div className="flex justify-between w-full items-center gap-2">
              <p className="text-black">12 Months</p>
              <div className="rounded-full bg-orange text-white px-2">
                30% Off
              </div>
            </div>
          </TabsTrigger>
        </TabsList>
      </div>

      <div className="w-full  md:px-16">
        {pricing.map((priceItem, index) => (
          <TabsContent
            value={priceItem.tabName}
            className={`flex md:flex-row gap-5 flex-col w-full justify-between  ${activeTab === priceItem.tabName ? "tab-content-active" : ""
              }`}
            key={index}
          >
            {priceItem.list.map((item) => (
              <div
                className="md:flex  md:flex-col w-full md:w-1/3 md:m-2 p-4 text-left rounded-lg "
                style={{
                  background: `linear-gradient(90deg, ${item.color[0]} 0%, ${item.color[1]} 100%)`,
                }}
              >
                {/* heading */}
                <div className="flex gap-4">
                  <img src={item.icons} alt="icon" width={30} />
                  <p className="text-xl md:text-2xl font-bold">{item.title}</p>
                </div>

                <div className="flex flex-col gap-2">
                  <p className="text-xl md:text-2xl font-medium">
                    {item.price}
                  </p>
                </div>

                <div>
                  {item.isActivePlan ? (
                    <Button
                      variant={"outline"}
                      size={"StretchedButton"}
                      className="w-full"
                      disabled
                    >
                      Already Unlocked
                    </Button>
                  ) : (
                    <Button
                      className="bg-orange w-full hover:bg-black"
                    >
                      Buy Now
                    </Button>
                  )}
                </div>
                <div className="flex flex-col gap-4">
                  {item.featureList.map((feature) => (
                    <div key={feature.title}>
                      <div className="flex gap-2 items-start p-2">
                        {feature.isTicked ? (
                          <img
                            src="/assets/icons/check.svg"
                            className="mt-2 mr-2"
                            alt="check"
                            width={20}
                          />
                        ) : (
                          <img
                            src="/assets/icons/unchecked.svg"
                            alt="unchecked"
                          />
                        )}
                        <div className="flex flex-col gap-2">
                          <p className="font-bold">{feature.title}</p>
                          <p>{feature.desc}</p>
                        </div>
                      </div>
                      <Separator
                        orientation="horizontal"
                        className={`${feature.isLineBelow ? "block" : "hidden"
                          } border border-slate-600`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
}
