import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Skeleton } from "@/components/ui/skeleton";

export default function Aichat({ message }: { message: string }) {
  console.log(message);
  return (
    <div className="flex flex-col w-fit">
      <div className="flex items-start gap-2 justify-start">
        {/* Chat Icon */}
        {/* {showExpression(expresion)} */}
        <img src="/assets/icons/blur-ball.svg" alt="matey" width={45} />
        {/* Message Box */}
        <div className="font-roboto custom-p  flex flex-col w-fit bg-gray-100  p-3 rounded-md ">
          {message == "" ? (
            <div className="flex flex-col gap-4 w-full">
              {/* line 1 */}
              <div className="flex gap-3 w-full">
                <Skeleton className="h-4 w-[420px] bg-ligherYellow" />
                <Skeleton className="h-4 w-[220px] bg-ligherYellow" />
                <Skeleton className="h-4 w-[80px] bg-ligherYellow" />
                <Skeleton className="h-4 w-[330px] bg-ligherYellow" />
              </div>
              {/* line 2 */}
              <div className="flex gap-3 w-full">
                <Skeleton className="h-4 w-[220px] bg-ligherYellow" />
                <Skeleton className="h-4 w-[80px] bg-ligherYellow" />
                <Skeleton className="h-4 w-[420px] bg-ligherYellow " />
                <Skeleton className="h-4 w-[330px] bg-ligherYellow " />
              </div>
            </div>
          ) : (
            <Markdown
              remarkPlugins={[remarkGfm]}
              className="text-black text-left"
            >
              {message}
            </Markdown>
          )}
        </div>
      </div>
      {/* <div className="w-[100px]">
        <GetPremium />
      </div> */}
    </div>
  );
}
