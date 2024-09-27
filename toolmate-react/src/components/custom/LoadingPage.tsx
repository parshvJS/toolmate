import Logo from "./Logo";
import MateyExpression from "./MateyExpression";

export default function LoadingPage({
    title
}: {
    title: string
}) {
    return (
        <div
            className="p-4 w-full h-full bg-gray-100"
        >
            <Logo />
            <div className="flex items-center justify-center flex-col w-full h-[calc(100vh-200px)] ">
                <MateyExpression expression={"tool"} />
                <p className="font-semibold text-lg animate-pulse text-black">{title}</p>
            </div>
        </div>
    )
}