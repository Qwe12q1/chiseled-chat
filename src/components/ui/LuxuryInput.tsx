import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface LuxuryInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
}

const LuxuryInput = React.forwardRef<HTMLInputElement, LuxuryInputProps>(
  ({ className, type, label, icon, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(false);

    return (
      <motion.div
        className="relative w-full"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              {icon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              "peer w-full h-14 bg-input border border-border rounded-sm",
              "text-foreground placeholder-transparent",
              "focus:border-marble-vein focus:ring-1 focus:ring-marble-vein/20 focus:outline-none",
              "transition-all duration-500 ease-out",
              "font-body text-sm tracking-wide",
              icon ? "pl-12 pr-4" : "px-4",
              "pt-5 pb-2",
              className
            )}
            ref={ref}
            placeholder={label}
            onFocus={() => setIsFocused(true)}
            onBlur={(e) => {
              setIsFocused(false);
              setHasValue(e.target.value.length > 0);
            }}
            onChange={(e) => setHasValue(e.target.value.length > 0)}
            {...props}
          />
          <motion.label
            className={cn(
              "absolute text-muted-foreground pointer-events-none",
              "transition-all duration-300 ease-out font-body",
              icon ? "left-12" : "left-4"
            )}
            animate={{
              top: isFocused || hasValue ? "8px" : "50%",
              y: isFocused || hasValue ? "0%" : "-50%",
              fontSize: isFocused || hasValue ? "10px" : "14px",
              letterSpacing: isFocused || hasValue ? "0.15em" : "0.05em",
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {label.toUpperCase()}
          </motion.label>
        </div>
        <motion.div
          className="absolute bottom-0 left-0 h-[1px] bg-marble-vein"
          initial={{ width: "0%" }}
          animate={{ width: isFocused ? "100%" : "0%" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </motion.div>
    );
  }
);

LuxuryInput.displayName = "LuxuryInput";

export { LuxuryInput };
