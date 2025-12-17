import React, { useState, useRef, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface ConsentWheelProps {
  isOpen: boolean;
  onComplete: (consent: boolean) => void;
}

// Константы для настройки
const SPIN_DURATION = 4; // секунды
const MIN_SPINS = 5; // минимальное кол-во полных оборотов
const SECTOR_MARGIN = 20; // отступ от границ сектора (чтобы стрелка не попала на линию)

const ConsentWheel: React.FC<ConsentWheelProps> = ({ isOpen, onComplete }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<boolean | null>(null);
  
  // Используем ref для текущего угла, чтобы вращение всегда продолжалось с места остановки
  const currentRotation = useRef(0);

  // Генерируем градиент один раз. 
  // Сектор ДА (0-180deg), Сектор НЕТ (180-360deg)
  // Мы поворачиваем сам градиент на -90deg, чтобы 0deg был ровно СВЕРХУ.
  const wheelBackground = useMemo(() => {
    return `conic-gradient(from -90deg, 
      hsl(var(--primary)) 0deg 180deg, 
      hsl(var(--destructive)) 180deg 360deg
    )`;
  }, []);

  const spin = () => {
    if (isSpinning) return;

    setIsSpinning(true);
    setResult(null);

    // 1. Определяем результат заранее (99% ДА, 1% НЕТ)
    const isYes = Math.random() < 0.99;

    // 2. Выбираем случайную точку внутри целевого сектора
    // Сектор "ДА" занимает 0..180 градусов.
    // Сектор "НЕТ" занимает 180..360 градусов.
    const minAngle = isYes ? 0 : 180;
    const maxAngle = isYes ? 180 : 360;

    // Генерируем случайный угол внутри сектора с учетом отступов (чтобы не попало на границу)
    const randomAngleInSector = 
      Math.random() * (maxAngle - minAngle - SECTOR_MARGIN * 2) + minAngle + SECTOR_MARGIN;

    // 3. Магия математики
    // Чтобы угол X оказался под стрелкой (которая наверху, на 0°), 
    // нам нужно повернуть колесо назад на этот угол (или вперед на 360 - X).
    const targetRotation = 360 - randomAngleInSector;

    // Добавляем полные обороты для эффектности
    const fullSpins = 360 * MIN_SPINS; 
    
    // Также добавляем случайное кол-во дополнительных оборотов (0-2) для вариативности
    const randomSpins = Math.floor(Math.random() * 3) * 360;

    // Считаем новый абсолютный угол поворота (текущий + новый)
    // Важно: мы прибавляем к предыдущему значению, чтобы колесо не дергалось назад
    const previousRotationMod = currentRotation.current % 360;
    const distanceToNextPosition = targetRotation - previousRotationMod + fullSpins + randomSpins;
    
    // Обновляем ref
    currentRotation.current += distanceToNextPosition;

    // 4. Таймер завершения
    setTimeout(() => {
      setIsSpinning(false);
      setResult(isYes);
    }, SPIN_DURATION * 1000);
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
          className="fixed inset-0 bg-background/95 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-6 overflow-hidden"
        >
          {/* Заголовок */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl font-bold tracking-tight mb-2">
              Согласие на обработку
            </h2>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              Испытайте удачу! Даёте ли вы согласие на обработку данных?
            </p>
          </motion.div>

          {/* Контейнер колеса */}
          <div className="relative mb-12">
            {/* Стрелка-указатель (статичная, поверх колеса) */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 drop-shadow-lg">
              <div className="w-0 h-0 
                border-l-[16px] border-l-transparent 
                border-r-[16px] border-r-transparent 
                border-t-[24px] border-t-foreground" 
              />
            </div>

            {/* Само вращающееся колесо */}
            <motion.div
              className="w-64 h-64 md:w-80 md:h-80 rounded-full border-4 border-foreground shadow-2xl relative overflow-hidden"
              style={{ backgroundImage: wheelBackground }}
              animate={{ rotate: currentRotation.current }}
              transition={{ 
                duration: SPIN_DURATION, 
                ease: [0.15, 0, 0.15, 1] // Custom bezier для реалистичного замедления (spin-down)
              }}
            >
              {/* Текстовые метки внутри колеса. Они крутятся вместе с ним. */}
              
              {/* Метка ДА (центр сектора 0-180 -> 90 градусов) */}
              <div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-right pr-8"
                style={{ transform: 'translate(-50%, -50%) rotate(-90deg)' }}
              >
                 {/* rotate(-90deg) ставит текст поперек радиуса, чтобы читалось по кругу */}
                <span className="text-3xl font-bold text-primary-foreground drop-shadow-md select-none">
                  ДА
                </span>
              </div>

              {/* Метка НЕТ (центр сектора 180-360 -> 270 градусов) */}
              <div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-left pl-8"
                style={{ transform: 'translate(-50%, -50%) rotate(-90deg)' }}
              >
                <span className="text-3xl font-bold text-primary-foreground drop-shadow-md select-none">
                  НЕТ
                </span>
              </div>
            </motion.div>
            
            {/* Центральная заглушка (ось) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-background rounded-full border-4 border-foreground z-10 shadow-inner flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
            </div>
          </div>

          {/* Результат и кнопки */}
          <div className="w-full max-w-xs space-y-4 min-h-[140px]">
            <AnimatePresence mode="wait">
              {result !== null && !isSpinning ? (
                <motion.div
                  key="result"
                  initial={{ scale: 0.9, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`p-4 rounded-xl text-center border ${
                    result 
                      ? "bg-primary/10 border-primary/20 text-primary" 
                      : "bg-destructive/10 border-destructive/20 text-destructive"
                  }`}
                >
                  <p className="font-medium text-lg">
                    Выпало: {result ? "ДА" : "НЕТ"}
                  </p>
                </motion.div>
              ) : (
                <motion.div key="placeholder" className="h-[62px]" /> // Placeholder чтобы кнопки не прыгали
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={result !== null ? handleContinue : spin}
              disabled={isSpinning}
              className={`w-full h-12 rounded-lg font-medium tracking-wide transition-colors ${
                result !== null
                 ? "bg-foreground text-background hover:bg-foreground/90" // Стиль кнопки "Продолжить"
                 : isSpinning
                    ? "bg-muted text-muted-foreground cursor-not-allowed" // Стиль когда крутится
                    : "bg-primary text-primary-foreground hover:bg-primary/90" // Стиль кнопки "Крутить"
              }`}
            >
              {isSpinning 
                ? "Крутится..." 
                : result !== null 
                  ? "Продолжить" 
                  : "Крутить колесо"}
            </motion.button>
          </div>

          <p className="mt-8 text-[10px] text-muted-foreground uppercase tracking-widest opacity-50">
            Развлекательный контент
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConsentWheel;
            
