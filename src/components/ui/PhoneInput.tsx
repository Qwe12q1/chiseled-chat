import React, { useState, forwardRef } from "react";
import { motion } from "framer-motion";
import { Phone } from "lucide-react";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  className?: string;
}

const DIAL_CODE = "+7";
const MASK = "(___) ___-__-__";

// Move function outside component to avoid hoisting issues
const formatWithMask = (input: string): string => {
  const digits = input.replace(/\D/g, "");
  let result = "";
  let digitIndex = 0;

  for (let i = 0; i < MASK.length && digitIndex < digits.length; i++) {
    if (MASK[i] === "_") {
      result += digits[digitIndex];
      digitIndex++;
    } else {
      result += MASK[i];
    }
  }

  return result;
};

const getInitialDisplayValue = (value: string): string => {
  if (value && value.startsWith(DIAL_CODE)) {
    const numberPart = value.slice(DIAL_CODE.length);
    return formatWithMask(numberPart);
  }
  return "";
};

const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, label = "Телефон", required, className }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [displayValue, setDisplayValue] = useState(() => getInitialDisplayValue(value));

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const digits = inputValue.replace(/\D/g, "");
      
      // Limit to 10 digits (Russian phone number without country code)
      const limitedDigits = digits.slice(0, 10);
      
      const formatted = formatWithMask(limitedDigits);
      setDisplayValue(formatted);
      
      // Send full phone number with country code
      onChange(DIAL_CODE + limitedDigits);
    };

    const hasValue = displayValue.length > 0;

    return (
      <div className={`relative ${className}`}>
        {/* Label */}
        <motion.label
          className="absolute left-12 text-muted-foreground pointer-events-none font-body tracking-wider origin-left z-10"
          animate={{
            y: isFocused || hasValue ? -24 : 14,
            scale: isFocused || hasValue ? 0.75 : 1,
            color: isFocused ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
          }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {label}
        </motion.label>

        <div className="relative flex items-center">
          {/* Input */}
          <input
            ref={ref}
            type="tel"
            value={displayValue}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            required={required}
            placeholder={isFocused ? MASK.replace(/_/g, "0") : ""}
            className="w-full h-14 pl-12 pr-12 bg-input border border-border rounded-2xl text-foreground font-body placeholder:text-muted-foreground/50 focus:outline-none focus:border-marble-vein transition-all duration-300"
          />

          {/* Phone icon */}
          <div className="absolute left-4 text-muted-foreground">
            <Phone size={18} />
          </div>
        </div>

        {/* Underline animation */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground origin-center rounded-full"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isFocused ? 1 : 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";

export { PhoneInput };
