import React, { useState, useEffect, forwardRef } from "react";
import { motion } from "framer-motion";
import { Phone, Globe } from "lucide-react";

interface Country {
  code: string;
  name: string;
  dialCode: string;
  mask: string;
  flag: string;
}

const countries: Country[] = [
  { code: "RU", name: "Россия", dialCode: "+7", mask: "(___) ___-__-__", flag: "🇷🇺" },
  { code: "KZ", name: "Казахстан", dialCode: "+7", mask: "(___) ___-__-__", flag: "🇰🇿" },
  { code: "BY", name: "Беларусь", dialCode: "+375", mask: "(__) ___-__-__", flag: "🇧🇾" },
  { code: "UA", name: "Украина", dialCode: "+380", mask: "(__) ___-__-__", flag: "🇺🇦" },
  { code: "UZ", name: "Узбекистан", dialCode: "+998", mask: "(__) ___-__-__", flag: "🇺🇿" },
];

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  className?: string;
}

const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, label = "Телефон", required, className }, ref) => {
    const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [displayValue, setDisplayValue] = useState("");

    // Parse existing value to extract country and number
    useEffect(() => {
      if (value && !displayValue) {
        // Try to detect country from value
        const matchedCountry = countries.find(c => value.startsWith(c.dialCode));
        if (matchedCountry) {
          setSelectedCountry(matchedCountry);
          const numberPart = value.slice(matchedCountry.dialCode.length);
          setDisplayValue(formatWithMask(numberPart, matchedCountry.mask));
        }
      }
    }, [value]);

    const formatWithMask = (input: string, mask: string): string => {
      const digits = input.replace(/\D/g, "");
      let result = "";
      let digitIndex = 0;

      for (let i = 0; i < mask.length && digitIndex < digits.length; i++) {
        if (mask[i] === "_") {
          result += digits[digitIndex];
          digitIndex++;
        } else {
          result += mask[i];
        }
      }

      return result;
    };

    const getDigitsFromMasked = (masked: string): string => {
      return masked.replace(/\D/g, "");
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const digits = inputValue.replace(/\D/g, "");
      
      // Limit digits based on mask
      const maxDigits = selectedCountry.mask.split("_").length - 1;
      const limitedDigits = digits.slice(0, maxDigits);
      
      const formatted = formatWithMask(limitedDigits, selectedCountry.mask);
      setDisplayValue(formatted);
      
      // Send full phone number with country code
      onChange(selectedCountry.dialCode + limitedDigits);
    };

    const handleCountrySelect = (country: Country) => {
      setSelectedCountry(country);
      setShowDropdown(false);
      
      // Reformat with new country code
      const digits = getDigitsFromMasked(displayValue);
      const maxDigits = country.mask.split("_").length - 1;
      const limitedDigits = digits.slice(0, maxDigits);
      const formatted = formatWithMask(limitedDigits, country.mask);
      setDisplayValue(formatted);
      onChange(country.dialCode + limitedDigits);
    };

    const hasValue = displayValue.length > 0;

    return (
      <div className={`relative ${className}`}>
        {/* Label */}
        <motion.label
          className="absolute left-14 text-muted-foreground pointer-events-none font-body tracking-wider origin-left z-10"
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
          {/* Country selector */}
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className="absolute left-0 top-0 bottom-0 flex items-center gap-1 px-3 border-r border-border text-foreground hover:bg-secondary/50 transition-colors duration-300 rounded-l-2xl z-10"
          >
            <span className="text-lg">{selectedCountry.flag}</span>
            <span className="text-xs text-muted-foreground">{selectedCountry.dialCode}</span>
          </button>

          {/* Input */}
          <input
            ref={ref}
            type="tel"
            value={displayValue}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            required={required}
            placeholder={isFocused ? selectedCountry.mask.replace(/_/g, "0") : ""}
            className="w-full h-14 pl-24 pr-4 bg-input border border-border rounded-2xl text-foreground font-body placeholder:text-muted-foreground/50 focus:outline-none focus:border-marble-vein transition-all duration-300"
          />

          {/* Phone icon */}
          <div className="absolute right-4 text-muted-foreground">
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

        {/* Country dropdown */}
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 mt-2 w-full bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {countries.map((country) => (
              <button
                key={country.code}
                type="button"
                onClick={() => handleCountrySelect(country)}
                className={`w-full flex items-center gap-3 p-3 hover:bg-secondary transition-colors duration-200 ${
                  selectedCountry.code === country.code ? "bg-secondary" : ""
                }`}
              >
                <span className="text-xl">{country.flag}</span>
                <span className="flex-1 text-left text-foreground text-sm">{country.name}</span>
                <span className="text-muted-foreground text-sm">{country.dialCode}</span>
              </button>
            ))}
          </motion.div>
        )}
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";

export { PhoneInput };
