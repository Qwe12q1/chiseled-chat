import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ConsentWheelProps {
  isOpen: boolean;
  onComplete: (consent: boolean) => void;
}

const ConsentWheel: React.FC<ConsentWheelProps> = ({ isOpen, onComplete }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<boolean | null>(null);
  const [rotation, setRotation] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);

  const spin = () => {
    if (isSpinning) return;

    setIsSpinning(true);
    setResult(null);

    // 99% Yes, 1% No
    const random = Math.random();
    const isYes = random < 0.99;

    // Calculate rotation - 5-8 full rotations plus landing position
    const fullRotations = (5 + Math.random() * 3) * 360;
    // Yes is at 0° (top), No is at 180° (bottom)
    // Add some variance within each half
    const landingAngle = isYes 
      ? (Math.random() * 160 - 80) // -80 to 80 degrees (Yes side)
      : (180 + Math.random() * 160 - 80); // 100 to 260 degrees (No side)
    
    const totalRotation = rotation + fullRotations + landingAngle;
    setRotation(totalRotation);

    setTimeout(() => {
      setIsSpinning(false);
      setResult(isYes);
    }, 4000);
  };

  const handleContinue = () => {
    onComplete(result ?? true);
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

            {/* Wheel container */}
            <div className="relative w-56 h-56 md:w-64 md:h-64">
              <motion.div
                ref={wheelRef}
                className="w-full h-full rounded-full border-4 border-foreground overflow-hidden shadow-2xl"
                animate={{ rotate: rotation }}
                transition={{ 
                  duration: 4, 
                  ease: [0.2, 0.8, 0.3, 1]
                }}
              >
                {/* Yes section (top) */}
                <div className="absolute inset-0">
                  <div 
                    className="absolute w-full h-1/2 bg-emerald-600 flex items-center justify-center"
                    style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" }}
                  >
                    <span className="text-white font-display text-2xl tracking-wider mt-8">
                      ДА
                    </span>
                  </div>
                </div>

                {/* No section (bottom) */}
                <div className="absolute inset-0">
                  <div 
                    className="absolute w-full h-1/2 bottom-0 bg-rose-600 flex items-center justify-center"
                    style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" }}
                  >
                    <span className="text-white font-display text-2xl tracking-wider mb-8">
                      НЕТ
                    </span>
                  </div>
                </div>

                {/* Center circle */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-foreground border-4 border-background z-10" />
              </motion.div>
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
                  result ? "bg-emerald-600/20 text-emerald-400" : "bg-rose-600/20 text-rose-400"
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
              disabled={isSpinning}
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
