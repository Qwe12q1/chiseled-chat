import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LuxuryInput } from "@/components/ui/LuxuryInput";
import { LuxuryButton } from "@/components/ui/LuxuryButton";
import { Phone, User, Lock, Eye, EyeOff, Mail } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

type AuthMode = "login" | "register";

const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate("/messenger");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === "login") {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: "Ошибка входа",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        const { error } = await signUp(email, password, { name, phone });
        if (error) {
          const msg = error.message || "";
          if (/already registered|user_already_exists/i.test(msg)) {
            setMode("login");
            toast({
              title: "Аккаунт уже существует",
              description: "Переключил на «Вход» — используйте этот email для авторизации.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Ошибка регистрации",
              description: msg,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Успешная регистрация",
            description: "Добро пожаловать в NOIR",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Произошла непредвиденная ошибка",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        staggerChildren: 0.05,
        staggerDirection: -1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Marble texture background */}
      <div className="absolute inset-0 marble-texture opacity-30" />
      <div className="absolute inset-0 marble-veins" />
      
      {/* Animated gradient orbs */}
      <motion.div
        className="absolute top-1/4 -left-32 w-96 h-96 bg-marble-vein/5 rounded-full blur-3xl"
        animate={{
          x: [0, 50, 0],
          y: [0, 30, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/4 -right-32 w-96 h-96 bg-marble-white/5 rounded-full blur-3xl"
        animate={{
          x: [0, -50, 0],
          y: [0, -30, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Auth card */}
      <motion.div
        className="relative w-full max-w-md"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="absolute inset-0 bg-card backdrop-blur-xl rounded-sm border border-border shadow-2xl animate-glow-pulse" />
        
        <div className="relative p-10 md:p-12">
          {/* Logo/Brand */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h1 className="font-display text-3xl md:text-4xl text-foreground tracking-wider mb-2">
              NOIR
            </h1>
            <div className="w-12 h-[1px] bg-marble-vein mx-auto mb-3" />
            <p className="text-muted-foreground text-xs tracking-[0.3em] uppercase font-body">
              Messenger
            </p>
          </motion.div>

          {/* Mode switcher */}
          <motion.div
            className="flex mb-10 border-b border-border"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-3 text-xs tracking-[0.2em] uppercase font-body transition-all duration-500 relative ${
                mode === "login"
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground/70"
              }`}
            >
              Вход
              {mode === "login" && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-[1px] bg-foreground"
                  layoutId="activeTab"
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                />
              )}
            </button>
            <button
              onClick={() => setMode("register")}
              className={`flex-1 py-3 text-xs tracking-[0.2em] uppercase font-body transition-all duration-500 relative ${
                mode === "register"
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground/70"
              }`}
            >
              Регистрация
              {mode === "register" && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-[1px] bg-foreground"
                  layoutId="activeTab"
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                />
              )}
            </button>
          </motion.div>

          {/* Form */}
          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              <motion.div variants={itemVariants}>
                <LuxuryInput
                  label="Email"
                  type="email"
                  icon={<Mail size={18} />}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </motion.div>

              {mode === "register" && (
                <>
                  <motion.div variants={itemVariants}>
                    <LuxuryInput
                      label="Имя"
                      type="text"
                      icon={<User size={18} />}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <LuxuryInput
                      label="Телефон"
                      type="tel"
                      icon={<Phone size={18} />}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+7 (999) 999-99-99"
                    />
                  </motion.div>
                </>
              )}

              <motion.div variants={itemVariants} className="relative">
                <LuxuryInput
                  label="Пароль"
                  type={showPassword ? "text" : "password"}
                  icon={<Lock size={18} />}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-300"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </motion.div>

              {mode === "login" && (
                <motion.div variants={itemVariants} className="text-right">
                  <button
                    type="button"
                    className="text-muted-foreground text-xs tracking-wider hover:text-foreground transition-colors duration-300 font-body"
                  >
                    Забыли пароль?
                  </button>
                </motion.div>
              )}

              <motion.div variants={itemVariants} className="pt-4">
                <LuxuryButton type="submit" isLoading={isLoading}>
                  {mode === "login" ? "Войти" : "Создать аккаунт"}
                </LuxuryButton>
              </motion.div>
            </motion.form>
          </AnimatePresence>

          {/* Bottom text */}
          <motion.p
            className="text-center mt-10 text-muted-foreground text-xs tracking-wide font-body"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            {mode === "login" ? (
              <>
                Нет аккаунта?{" "}
                <button
                  onClick={() => setMode("register")}
                  className="text-foreground hover:text-marble-vein transition-colors duration-300 tracking-wider"
                >
                  Зарегистрироваться
                </button>
              </>
            ) : (
              <>
                Уже есть аккаунт?{" "}
                <button
                  onClick={() => setMode("login")}
                  className="text-foreground hover:text-marble-vein transition-colors duration-300 tracking-wider"
                >
                  Войти
                </button>
              </>
            )}
          </motion.p>
        </div>
      </motion.div>

      {/* Decorative elements */}
      <div className="absolute bottom-8 left-8 text-muted-foreground/30 text-xs tracking-[0.3em] font-body hidden md:block">
        © 2024 NOIR
      </div>
      <div className="absolute bottom-8 right-8 text-muted-foreground/30 text-xs tracking-[0.3em] font-body hidden md:block">
        SECURE · PRIVATE · ELEGANT
      </div>
    </div>
  );
};

export default AuthPage;
