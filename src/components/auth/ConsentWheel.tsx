import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface ConsentWheelProps {
  isOpen: boolean;
  onComplete: (consent: boolean) => void;
}

const SPIN_MS = 4000;
const MARGIN_DEG = 18;

const mod360 = (n: number) => ((n % 360) + 360) % 360;

const ConsentWheel: React.FC<ConsentWheelProps> = ({ isOpen, onComplete }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<boolean | null>(null);
  const [rotation, setRotation] = useState(0);

  const gradient = useMemo(() => {
    // Yes: right half (0-180), No: left half (180-360)
    // Use design tokens (HSL) for colors.
    // `from -90deg` ensures the gradient starts at the top (under the pointer) consistently.
    return `conic-gradient(from -90deg, hsl(var(--primary)) 0deg 180deg, hsl(var(--destructive)) 180deg 360deg)`;
  }, []);

  const spin = () => {
    if (isSpinning) return;

    setIsSpinning(true);
    setResult(null);

    // 99% Yes, 1% No
    const isYes = Math.random() < 0.99;

    // Keep the pointer away from the boundary (center of the sector)
    const desiredRemainder = isYes
      ? 180 + MARGIN_DEG + Math.random() * (180 - MARGIN_DEG * 2) // 198..342 (lands on YES)
      : MARGIN_DEG + Math.random() * (180 - MARGIN_DEG * 2); // 18..162 (lands on NO)

    const currentRemainder = mod360(rotation);
    const deltaToDesired = mod360(desiredRemainder - currentRemainder);

    // 5-8 full rotations + adjust to land precisely
    const fullRotations = (5 + Math.random() * 3) * 360;

    setRotation((prev) => prev + fullRotations + deltaToDesired);

    window.setTimeout(() => {
      setIsSpinning(false);
      setResult(isYes);
    }, SPIN_MS);
  };

  const handleContinue = () => {
    if (result === null) return;
    onComplete(result);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/95 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-6"
        >
          {/* Title */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <h2 className="font-display text-xl md:text-2xl text-foreground tracking-wider mb-3">
              Согласие на обработку данных
            </h2>
            <p className="text-muted-foreground text-sm max-w-sm">
              Даёте ли вы согласие на обработку персональных данных в рекламных целях?
            </p>
          </motion.div>

          {/* Wheel */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="relative mb-8"
          >
            {/* Pointer */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
              <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-foreground" />
            </div>

            <div className="relative w-56 h-56 md:w-64 md:h-64">
              <motion.div
                className="w-full h-full rounded-full border-4 border-foreground overflow-hidden shadow-2xl"
                style={{ backgroundImage: gradient }}
                animate={{ rotate: rotation }}
                transition={{ duration: SPIN_MS / 1000, ease: [0.2, 0.8, 0.3, 1] }}
              />

              {/* Labels */}
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute top-1/2 right-[18%] -translate-y-1/2">
                  <span className="font-display text-2xl tracking-wider text-primary-foreground rotate-90 inline-block">
                    ДА
                  </span>
                </div>
                <div className="absolute top-1/2 left-[18%] -translate-y-1/2">
                  <span className="font-display text-2xl tracking-wider text-primary-foreground -rotate-90 inline-block">
                    НЕТ
                  </span>
                </div>
              </div>

              {/* Center */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-foreground border-4 border-background z-10" />
            </div>
          </motion.div>

          {/* Result display */}
          <AnimatePresence mode="wait">
            {result !== null && !isSpinning && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className={`mb-6 px-6 py-3 rounded-2xl ${
                  result
                    ? "bg-primary/15 text-foreground"
                    : "bg-destructive/15 text-foreground"
                }`}
              >
                <span className="font-display text-lg tracking-wider">
                  Выпало: {result ? "ДА" : "НЕТ"}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Buttons */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col gap-3 w-full max-w-xs"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={spin}
              disabled={isSpinning}
              className={`w-full h-14 rounded-2xl font-display tracking-wider text-sm uppercase transition-all duration-300 ${
                isSpinning
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-foreground text-background hover:bg-foreground/90"
              }`}
            >
              {isSpinning ? "Крутится..." : "Крутить"}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleContinue}
              disabled={isSpinning || result === null}
              className="w-full h-12 rounded-2xl border border-border font-body tracking-wider text-sm text-muted-foreground hover:text-foreground hover:border-foreground/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Продолжить
            </motion.button>
          </motion.div>

          {/* Fine print */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 text-xs text-muted-foreground/50 text-center max-w-xs"
          >
            Результат носит исключительно развлекательный характер
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConsentWheel;

