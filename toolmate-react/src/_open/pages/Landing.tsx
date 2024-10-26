import DemoVideo from "@/components/custom/DemoVideo";
import CommunityExample from "@/components/custom/CommunityExample";
import FeatureWindow from "@/components/custom/FeatureWindow";
import Price from "@/components/custom/Price";
import ButtonCustom from "@/components/custom/ButtonCustom";
import { Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { MobileMock } from "@/components/custom/Mobile-mock";



const largeFeatureCardsContent = [
  {
    icon: "/assets/icons/largeOrangeToolbox.svg",
    titleLable: "Tailored for Your Project",
    title: "Find the Perfect Tool for Every Job",
    desc: "Matey suggests the right tools for your DIY needs, ensuring efficiency.",
    ctaText: "Find Tools with Matey",
    mateyImagePath: "/assets/images/temp.png",
    leftGradient: true,
  },
  {
    icon: "/assets/icons/priceTag.svg",
    titleLable: "Tools That Fit Your Budget",
    title: "Get the Best Tools at the Best Prices",
    desc: "Matey offers budget-friendly tool suggestions for all DIYers.",
    ctaText: "Budget-Friendly Tools",
    mateyImagePath: "/assets/images/temp2.png",
    leftGradient: false,
  },
  {
    icon: "/assets/icons/helmet.svg",
    titleLable: "Work Smarter, Work Safer",
    title: "Always Equipped with the Right Safety Gear",
    desc: "Matey recommends the best protective gear for safe DIY projects.",
    ctaText: "Safeguard DIY Project",
    mateyImagePath: "/assets/images/temp.png",
    leftGradient: true,
  },
];

export default function Landing() {


  return (
    <div className="md:px-20 px-2">
      <div className="md:mt-28 mt-20">
        {/* hero section */}
        <section className="flex justify-between md:flex-row flex-col md:p-12 p-2 relative">
          {/* left side */}
          <div className="text-center md:text-left md:w-2/3 max-w-2/5 place-content-center flex flex-col gap-8">
            <p className="text-transparent leading-10 md;leading-normal bg-clip-text bg-gradient-to-r from-black  to-black font-[1000] md:text-8xl  text-6xl text-left">
              Find The Right<br /> Tool For
              Every <br /> DIY Job!
            </p>
            <p className="md:w-2/3 font-bold md:text-lg text-md w-full text-left">
              Meet Matey, your ultimate DIY companion. From novices to experts, Matey guides you to the perfect tools for every project.
            </p>
            <div className="flex gap-2 items-center md:items-start ">
              <ButtonCustom
                navigator="/preview"
                text="Chat With Matey Now"
                isArrow={true}
                isDark={true}
              />
            </div>
            <div className="flex gap-2 flex-col mt-5">
              {/* users */}
              <div className="font-bold text-3xl items-center gap-10 text-left w-fit flex  ">
                <div>
                  <img
                    src="/assets/icons/image.png"
                    alt="user"
                    className="max-w-32"
                    width={220}
                  />
                </div>
                {/* <Separator
                  orientation="vertical"
                  className="border border-gray"
                /> */}
                {/* <div className="flex items-center flex-col text-left">
                  <p className="font-semibold text-left opacity-80 text-slate-500 text-md">
                    Trusted by People
                  </p>
                  <p className="font-mono md:text-2xl text-lg">100K+ Users</p>
                </div> */}
              </div>
            </div>
          </div>


          <div className="p-2 w-full md:w-3/5 h-full flex justify-center items-start">
            <div className="md:mt-0  absolute w-[700px]  h-[700px] -top-9  -z-20 flex justify-center bg-[url('/assets/images/square.svg')] bg-cover bg-center bg-no-repeat"></div>
            <MobileMock />
          </div>
        </section>

        <section className="hidden flex w-full">
          {/* left */}
          <div className="w-1/2">
            <div>
              <p className="text-transparent font-[540] leading-tight bg-clip-text bg-gradient-to-r from-black tracking-tight to-black  md:text-[5rem]  text-6xl text-left">
                Find The Right Tool  For
                Every DIY Job!
              </p>

            </div>
            {/* bottom */}
            <div className="w-full flex gap-4">

              <div className="w-1/2 mt-4 ">
                <p className="font-bold md:text-lg text-md w-full text-justify">
                  Meet Matey, your ultimate DIY companion. From novices to experts, Matey guides you to the perfect tools for every project.
                </p>
                <div className="flex gap-2 mt-4 items-center md:items-start ">
                  <Link to={"/preview"} className="flex flex-col gap-4 w-full">
                    <div className="px-4 text-lg hover:scale-105 text-white py-2 cursor-pointer bg-gradient-to-r to-orange-yellow-0 from-orange transition-all duration-150 w-2/3 rounded-md ">
                      Chat With Matey Now
                    </div>
                  </Link>
                </div>
              </div>

            </div>
          </div>

          <div className="opacity-75 bg-gradient-to-r w-1/2 min-h-full rounded-xl from-lightOrange to-orange flex-1">
            sdfsd
          </div>

        </section>

        {/* demo video section */}
        <section className="w-full mt-10">
          {/* main/base */}
          <div className="bg-white md:p-0 p-2 rounded-2xl">
            {/* title infography
            <div className="md:flex hidden gap-2 items-center justify-center">
              <p className="text-3xl md:text-8xl font-semibold">
                Let Matey Show His
              </p>
              <h1 className="text-6xl font-bold">
                <span className="font-semibold text-3xl md:text-8xl  bg-clip-text text-transparent bg-gradient-to-r from-yellow to-orange drop-shadow-[0_4px_4px_rgba(4,4,4,0.3)]">
                  Know-how
                </span>
              </h1>
            </div> */}

            {/* mobile text */}
            <p className="md:hidden font-semibold text-4xl w-full h-full">
              Let Matey Show his
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow to-orange drop-shadow-[0_4px_4px_rgba(4,4,4,0.3)]"> Know-How</span>
            </p>
            {/* videop */}
            <DemoVideo />
          </div>
        </section>





        {/* mixed color text */}
        <div className="md:my-20 mt-1 p-2 ">
          {/* header */}
          <p className="md:text-8xl text-4xl my-5 font-black md:text-center text-left px-4">
            Discover How
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange to-lightOrange"> Matey </span>
            Makes
            DIY Easier
          </p>
          {/* Large Feature Card
          {largeFeatureCardsContent.map((cardContent, index) => (
            <LargeFeatureCard key={index} {...cardContent} />
          ))} */}

          <div className="flex flex-wrap justify-center w-full h-full items-center gap-2">
            <div className="w-11/12 flex gap-2 h-full">
              {
                largeFeatureCardsContent.map((cardContent) => (
                  <div className="w-[calc(33%-0.5rem)] h-full flex flex-col justify-between border-2 border-slate-200  rounded-2xl shadow-slate-300   shadow-md">
                    <div>
                      <img src={cardContent.mateyImagePath + "-"} alt="" className="bg-white h-[450px] rounded-t-2xl border-b-2 border-slate-200 min-w-full overflow-hidden " />
                    </div>

                    <div className="px-6 py-7">
                      <div className="w-full flex justify-between">
                        <p className="text-3xl w-3/4 text-left font-semibold">{cardContent.title}</p>

                      </div>

                      <Link to={"/preview"} className="flex flex-col gap-4">
                        <p className="text-md text-left">{cardContent.desc}</p>

                        <div className="px-4 text-lg hover:scale-105 text-white py-2 cursor-pointer bg-gradient-to-r to-orange-yellow-0 from-orange transition-all duration-150 w-2/3 rounded-md ">
                          {cardContent.ctaText}
                        </div>
                      </Link>
                    </div>
                  </div>
                ))
              }

            </div>
          </div>
        </div>

        {/* grid stock video section */}

        <p className="md:text-8xl text-4xl my-5 font-black md:text-center text-left px-4 h-full">
          How
          <span className="text-orange text-left"> Matey </span>
          Simplifies Your <br />
          DIY Journey
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* card 1 */}
          <div className="relative col-span-1 md:col-span-2 bg-slate-400 rounded-3xl shadow-md h-[440px]">
            <video
              className="absolute inset-0 w-full h-full object-cover rounded-3xl"
              src="/video/vid1.mp4"
              autoPlay
              loop
              muted
            />
            <div className="absolute inset-0 bg-black opacity-35 rounded-3xl"></div>
            <div className="relative z-10 p-7 drop-shadow-sm h-full text-left flex flex-col justify-between">
              {/* content */}
              <div>
                <p className="md:text-5xl text-3xl md:w-3/4 w-full font-bold text-white">
                  Find the Right Tools Fast
                </p>
                <p className="text-slate-300 text-xl font-bold mt-4 w-3/4</p>">
                  Effortlessly discover the perfect tools tailored to your
                  unique projects.
                </p>
              </div>

              {/* CTA */}
              <Link
                to={"/preview"}
                className="w-fit bg-orange hover:bg-lightOrange rounded-lg p-4 text-white hover:bg-transparent hover:text-orange border-2 border-orange"
              >
                <p className="font-bold">Explore Tool Suggestions</p>
              </Link>
            </div>
          </div>

          {/* card2 */}
          <div className="relative bg-slate-400 rounded-3xl shadow-md h-[440px]">
            <img
              className="absolute inset-0 w-full h-full object-cover rounded-3xl"
              src="/assets/images/tools.jpg"
            />
            <div className="absolute inset-0 bg-black opacity-35 rounded-3xl"></div>

            <div className="relative z-10 p-7 drop-shadow-sm h-full text-left flex flex-col justify-between">
              {/* content */}
              <div>
                <p className="md:text-5xl text-3xl md:w-3/4 w-full font-bold text-w</p>hite">
                  Your Project, Your Tools, One Click
                </p>
                <p className="text-slate-300 text-xl font-semibold mt-4 w</p>-3/4">
                  Get a complete list of what you need, instantly.
                </p>
              </div>
            </div>
          </div>

          {/* card3 */}
          <div className="relative bg-slate-400 rounded-3xl shadow-md h-[440px]">
            <img
              className="absolute inset-0 w-full h-full object-cover rounded-3xl"
              src="/assets/images/personalized.jpg"
            />
            <div className="absolute inset-0 bg-black opacity-35 rounded-3xl"></div>

            <div className="relative z-10 p-7 drop-shadow-sm h-full text-left flex flex-col justify-between">
              {/* content */}
              <div>
                <p className="md:text-5xl text-3xl md:w-3/4 w-full font-bold text-white">
                  Keep Track of Every Project and Tool
                </p>
                <p className="text-white text-xl font-semibold mt-4 w-3/4">
                  Personalized help based on what you've used before.
                </p>
              </div>
            </div>
          </div>

          {/* card 4 */}
          <div className="relative col-span-1 md:col-span-2 bg-slate-400 rounded-3xl shadow-md h-[440px]">
            <video
              className="absolute inset-0 w-full h-full object-cover rounded-3xl"
              src="/video/vid2.mp4"
              autoPlay
              loop
              muted
              preload="auto"
              playsInline
            />
            <div className="absolute inset-0 bg-black opacity-35 rounded-3xl"></div>
            <div className="relative z-10 p-7 drop-shadow-sm h-full text-left flex flex-col justify-between">
              {/* content */}
              <div>
                <p className="md:text-5xl text-3xl md:w-3/4 w-full font-bold text-white">
                  Join a DIY Community
                </p>
                <p className="text-slate-300 text-xl font-bold mt-4 w-3/4">
                  Connect, share, and learn with fellow DIY enthusiasts through
                  our dedicated community.
                </p>
              </div>

              {/* CTA */}
              <Link
                to={"/preview"}
                className="w-fit bg-orange hover:bg-lightOrange rounded-lg p-4 text-white hover:bg-transparent hover:text-orange border-2 border-orange"
              >
                <p className="font-bold">Join the DIY Community</p>
              </Link>
            </div>
          </div>
        </div>
        {/* community section */}

        <div className="mx-16">

          <p className="md:text-8xl text-4xl my-5 font-black md:text-center text-left mt-32">
            Explore
            <span className="text-orange text-left"> Interactive </span>
            Community
          </p>
          {/* content */}
          <CommunityExample />
        </div>

        {/* feature window section */}

        <div className="md:my-36 my-20">
          {/* header */}
          <p className="md:text-8xl text-4xl  font-black hidden md:block">
            Every Tool You Need,
            <span className="text-orange"> Matey’s </span>
            Got You Covered!
          </p>
          <FeatureWindow />
        </div>

        {/* price page */}

        <div className="my-20 md:my-36">
          {/* header */}
          <p className="md:text-8xl text-4xl my-5 font-black md:text-center text-left px-4">
            Get Started With
            <span className="text-orange text-left"> ToolMate </span>
            Today
          </p>
          {/* prices */}

          <Price />
        </div>
      </div>
    </div>
  );
}
