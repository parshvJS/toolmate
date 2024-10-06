/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
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
        small: "px-3 rounded-md py-2 text-sm",
        medium: "px-4 py-2 text-base",
        large: "px-6 py-4 text-lg md:px-7 md:py-5",
    };

    const commonClasses = `w-fit flex items-center justify-center gap-2 rounded-full text-white transition-all ${sizeClasses[size]} relative overflow-hidden`;

    return (
        <motion.button
            onClick={handleClick}
            whileHover={{
                scale: 1.05,
                boxShadow: "0px 15px 30px rgba(0, 0, 0, 0.2)",
            }}
            whileTap={{ scale: 0.95 }}
            className={
                isDark
                    ? `${commonClasses} bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500 hover:bg-gradient-to-bl`
                    : `${commonClasses} bg-gradient-to-r from-gray-800 via-black to-gray-900 hover:bg-gradient-to-tr`
            }
        >
            {/* Gradient Animation Layer */}
            <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent to-transparent opacity-10"
                initial={{ backgroundPosition: "0% 50%" }}
                animate={{ backgroundPosition: "100% 50%" }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />

            {/* Shimmer Hover Effect */}
            <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />

            {/* Button Content */}
            <div className="flex items-center justify-center gap-2 relative z-10">
                <p className="font-semibold">{text}</p>
                {isArrow && (
                    <motion.div
                        whileHover={{ x: 8 }}
                        transition={{ type: "spring", stiffness: 300 }}
                    >
                        <ArrowRight />
                    </motion.div>
                )}
            </div>
        </motion.button>
    );
}

export default ButtonCustom;

  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
    function ({ addUtilities, theme }) {
      const newUtilities = Object.entries(theme("gridTemplateColumnsMain")).reduce(
        (acc, [key, value]) => {
          acc[`.grid-cols-main-${key}`] = { gridTemplateColumns: value };
          return acc;
        },
        {}
      );
      addUtilities(newUtilities, ["responsive"]);
    },
    function ({ addUtilities, theme }) {
      const newUtilities = Object.entries(theme("placeholderColor")).reduce(
        (acc, [key, value]) => {
          acc[`.placeholder-${key}`] = { "::placeholder": { color: value } };
          return acc;
        },
        {}
      );
      addUtilities(newUtilities, ["responsive", "hover"]);
    },
  ],
};
