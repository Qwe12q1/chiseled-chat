import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface LuxuryButtonProps {
  variant?: "primary" | "outline" | "ghost";
  isLoading?: boolean;
  className?: string;
  children?: React.ReactNode;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  disabled?: boolean;
}

const LuxuryButton: React.FC<LuxuryButtonProps> = ({
  className,
  children,
  variant = "primary",
  isLoading,
  type = "button",
  onClick,
  disabled,
}) => {
  const variants = {
    primary: "bg-primary text-primary-foreground hover:bg-marble-white hover:text-onyx",
    outline: "bg-transparent border border-border text-foreground hover:bg-secondary hover:border-marble-vein",
    ghost: "bg-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50",
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(
        "relative w-full h-14 rounded-2xl overflow-hidden",
        "tracking-[0.25em] uppercase text-xs font-medium font-body",
        "transition-all duration-500 ease-out",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        className
      )}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.2 }}
    >
      <motion.span
        className="relative z-10 flex items-center justify-center gap-2"
        initial={{ opacity: 1 }}
        animate={{ opacity: isLoading ? 0 : 1 }}
      >
        {children}
      </motion.span>
      
      {isLoading && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="w-5 h-5 border border-current border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>
      )}
      
      {/* Hover effect overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
        initial={{ x: "-100%" }}
        whileHover={{ x: "100%" }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      />
    </motion.button>
  );
};

export { LuxuryButton };
