import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

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
        small: "px-3 py-2 text-sm",
        medium: "px-4 py-2 text-base",
        large: "px-5 py-3 text-lg md:px-6 md:py-4",
    };

    const commonClasses = `w-fit flex items-center justify-center gap-2 rounded-lg text-white font-semibold transition-all duration-500 overflow-hidden relative ${sizeClasses[size]} font-roboto`;

    return (
        <motion.button
            onClick={handleClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={
                isDark
                    ? `${commonClasses} bg-gradient-to-tr from-yellow to-orange hover:bg-gradient-to-bl hover:from-yellow-500 hover:to-orange-600`
                    : `${commonClasses} bg-gradient-to-tr from-gray to-black hover:bg-gradient-to-br hover:from-gray-700 hover:to-black`
            }
        >
            {/* Dynamic Gradient Background Animation */}
            <motion.div
                className="absolute inset-0 bg-gradient-to-r from-yellow to-orange opacity-20"
                initial={{ backgroundPosition: "0% 50%" }}
                animate={{ backgroundPosition: "100% 50%" }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            {/* Button Content */}
            <div className="flex items-center justify-center z-10">
                <p className="text-base md:text-lg">{text}</p>
                {isArrow && (
                    <motion.div whileHover={{ x: 8 }} className="ml-2">
                        <ArrowRight />
                    </motion.div>
                )}
            </div>
        </motion.button>
    );
}

export default ButtonCustom;
