import { Separator } from "../ui/separator";
import ButtonCustom from "./ButtonCustom";

export default function FeatureWindow() {
  const largeFeatureCardsContent = [
    {
      tag: "Personalization",
      title: "Your DIY Guide",
      desc: "Get Expert Tips for Every Project",
      windowExampleImage: "/assets/icons/yellow-bg.svg",
      CTA: "Explore Your companion",
      lineBelowSection: false,
      featuresList: [
        {
          icon: "/assets/icons/orangePencil.svg",
          title: "Personalized Experience",
          desc: "Elevate Your DIY Game with Custom Tips and Advice",
          lineBelow: true,
        },
        {
          icon: "/assets/icons/orangeMoon.svg",
          title: "Tool Finder",
          desc: "Discover the Best Tools and Resources for Your Project",
          lineBelow: true,
        },
        {
          icon: "/assets/icons/orangeTick.svg",
          title: "Trusted Guidance",
          desc: "Get Expert Advice for Safe, Successful DIY Projects",
          lineBelow: false,
        },
      ],
    },
    {
      tag: "Community",
      title: "Collaborative Creative Space",
      desc: "Join workshops, get expert advice, and grow together.",
      windowExampleImage: "assets/icons/yellow-bg-1.svg",
      CTA: "Find People Like You",
      lineBelowSection: true,
      featuresList: [
        {
          icon: "/assets/icons/orageGrid.svg",
          title: "Creative Workshop",
          desc: "Boost Your Projects with Tailored Ideas and Support",
          lineBelow: true,
        },
        {
          icon: "/assets/icons/orangeMoon.svg",
          title: "Pro Guidance",
          desc: "Access expert advice to elevate your projects.",
          lineBelow: false,
        },
      ],
    },

  ];

  return (
    <section>
      {/* main sections */}
      {largeFeatureCardsContent.map((feature, index) => (
        // main content
        <div className="my-7 gap-5" key={index}>
          {/* main content */}
          <div className="flex mx-4 justify-between md:flex-row flex-col">
            {/* left side */}
            <div className="flex flex-col gap-4">
              <div className="bg-lightYellow text-black md:block hidden font-semibold px-14 py-2 rounded-md md:w-fit w-full">
                {feature.tag}
              </div>
              <hr className="md:hidden border border-slate-500" />
              <p className="font-bold md:text-6xl text-5xl text-left text-black">
                {feature.title}
              </p>

              <p className="text-left font-normal text-slate-700 text-lg">
                {feature.desc}
              </p>

              {/* <Button
                variant={"orangeGradient"}
                size={"StretchedButton"}
                className="w-fit"
              >
                {feature.CTA}
              </Button> */}
              <ButtonCustom
                size={"small"}
                navigator="/preview"
                text={feature.CTA}
                isArrow={true}
                isDark={true}
              />
            </div>


            {/* desktop side section */}
            {/* right side */}
            <div className="hidden md:block mx-4">
              {feature.featuresList.map((feauteItem, index: number) => (
                <div key={index}>
                  {/* main content */}
                  <div className="p-2 px-4 flex gap-4 text-left items-center">
                    {/* icon */}
                    <div>
                      <img src={feauteItem.icon} alt={feauteItem.title} />
                    </div>

                    {/* text content */}
                    <div>
                      <p className="text-black font-semibold">
                        {feauteItem.title}
                      </p>
                      <p className="text-gray">
                        {feauteItem.desc}
                      </p>
                    </div>
                  </div>

                  <div>
                    {feauteItem.lineBelow ? <Separator /> : <div></div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* feautre image */}
          <div className="md:my-10 h-[500px] hidden md:block">
            <img
              src={feature.windowExampleImage}
              className="w-full "
              alt={feature.CTA}
            />
          </div>


          {/* mobile side section */}
          <div className="md:hidden flex flex-col">
            <div className="md:my-24 my-10 ">
              <img
                src={feature.windowExampleImage}
                className="w-full "
                alt={feature.CTA}
              />
            </div>
            {/* feature  */}
            <div>
              {feature.featuresList.map((feauteItem, index: number) => (
                <div key={index}>
                  {/* main content */}
                  <div className="p-2 flex gap-4 text-left items-center">
                    {/* icon */}
                    <div>
                      <img src={feauteItem.icon} alt={feauteItem.title} />
                    </div>

                    {/* text content */}
                    <div>
                      <p className="text-black font-semibold">
                        Creative Workshops
                      </p>
                      <p className="text-gray">
                        Boost Your Projects with Tailored Ideas and Support
                      </p>
                    </div>
                  </div>

                  <div>
                    {feauteItem.lineBelow ? <Separator /> : <div></div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
