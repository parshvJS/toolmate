import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

function ButtonCustom({
    navigator,
    text,
    isArrow,
    isDark,
    size = "large",
}: {
    navigator: string;
    text: string;
    isArrow: boolean;
    isDark: boolean;
    size?: "small" | "medium" | "large";
}) {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(navigator);
    };

    const sizeClasses = {
        small: "px-3 rounded-md py-2 text-sm",
        medium: "px-4 py-2 text-base",
        large: "px-5 py-3 text-lg md:px-6 md:py-4",
    };

    const commonClasses = `w-fit flex items-center justify-center gap-2 rounded-2xl transition-all ${sizeClasses[size]}`;

    if (!isDark) {
        return (
            <button
                onClick={handleClick}
                className={`${commonClasses} bg-gradient-to-tr from-white to-white text-orange border-2 border-orange hover:from-orange hover:to-lightOrange hover:text-white hover:shadow-lg hover:shadow-slate-200`}
            >
                <div className="flex items-center justify-center gap-2">
                    <p className="font-semibold">{text}</p>
                    {isArrow && <ArrowRight />}
                </div>
            </button>
        );
    } else {
        return (
            <button
                onClick={handleClick}
                className={`${commonClasses} bg-gradient-to-tr from-orange to-lightOrange border-2 border-transparent text-white hover:from-white hover:to-white hover:border-orange hover:text-orange`}
            >
                <div className="flex items-center justify-center gap-2">
                    <p className="font-semibold md:text-lg text-base">{text}</p>
                    {isArrow && <ArrowRight />}
                </div>
            </button>
        );
    }
}

export default ButtonCustom;
