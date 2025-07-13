import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  Heart, 
  Star, 
  Zap, 
  Check, 
  X, 
  Eye,
  MessageSquare,
  ArrowRight,
  Loader2,
  Bell,
  Gift,
  Rocket
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MicroInteractionProps {
  type: "success" | "error" | "loading" | "celebration" | "attention";
  trigger?: boolean;
  onComplete?: () => void;
  className?: string;
}

export function MicroInteraction({ 
  type, 
  trigger = false, 
  onComplete,
  className 
}: MicroInteractionProps) {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (trigger) {
      setIsActive(true);
      const timer = setTimeout(() => {
        setIsActive(false);
        onComplete?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [trigger, onComplete]);

  const getAnimation = () => {
    switch (type) {
      case "success":
        return {
          icon: Check,
          color: "text-green-500",
          bgColor: "bg-green-100",
          particles: Array.from({ length: 6 }, (_, i) => ({
            id: i,
            delay: i * 0.1,
            x: Math.random() * 100 - 50,
            y: Math.random() * 100 - 50
          }))
        };
      case "error":
        return {
          icon: X,
          color: "text-red-500",
          bgColor: "bg-red-100",
          particles: Array.from({ length: 4 }, (_, i) => ({
            id: i,
            delay: i * 0.15,
            x: Math.random() * 60 - 30,
            y: Math.random() * 60 - 30
          }))
        };
      case "celebration":
        return {
          icon: Sparkles,
          color: "text-yellow-500",
          bgColor: "bg-yellow-100",
          particles: Array.from({ length: 12 }, (_, i) => ({
            id: i,
            delay: i * 0.05,
            x: Math.random() * 120 - 60,
            y: Math.random() * 120 - 60
          }))
        };
      case "loading":
        return {
          icon: Loader2,
          color: "text-blue-500",
          bgColor: "bg-blue-100",
          particles: []
        };
      case "attention":
        return {
          icon: Bell,
          color: "text-purple-500",
          bgColor: "bg-purple-100",
          particles: Array.from({ length: 8 }, (_, i) => ({
            id: i,
            delay: i * 0.08,
            x: Math.random() * 80 - 40,
            y: Math.random() * 80 - 40
          }))
        };
      default:
        return {
          icon: Star,
          color: "text-gray-500",
          bgColor: "bg-gray-100",
          particles: []
        };
    }
  };

  const animation = getAnimation();
  const Icon = animation.icon;

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          className={cn("relative", className)}
        >
          {/* Main Icon */}
          <motion.div
            initial={{ scale: 0.8, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 20 
            }}
            className={cn(
              "relative z-10 rounded-full p-2 flex items-center justify-center",
              animation.bgColor
            )}
          >
            <motion.div
              animate={{ 
                rotate: type === "loading" ? 360 : 0,
                scale: type === "celebration" ? [1, 1.2, 1] : 1
              }}
              transition={{ 
                rotate: { 
                  repeat: type === "loading" ? Infinity : 0,
                  duration: 1,
                  ease: "linear"
                },
                scale: {
                  repeat: type === "celebration" ? Infinity : 0,
                  duration: 0.5
                }
              }}
            >
              <Icon className={cn("h-5 w-5", animation.color)} />
            </motion.div>
          </motion.div>

          {/* Particles */}
          {animation.particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{ 
                opacity: 0, 
                scale: 0,
                x: 0,
                y: 0
              }}
              animate={{ 
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
                x: particle.x,
                y: particle.y
              }}
              transition={{
                duration: 1.5,
                delay: particle.delay,
                ease: "easeOut"
              }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className={cn(
                "w-2 h-2 rounded-full",
                type === "success" ? "bg-green-400" :
                type === "error" ? "bg-red-400" :
                type === "celebration" ? "bg-yellow-400" :
                type === "attention" ? "bg-purple-400" :
                "bg-blue-400"
              )} />
            </motion.div>
          ))}

          {/* Ripple Effect */}
          <motion.div
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 1 }}
            className={cn(
              "absolute inset-0 rounded-full border-2",
              type === "success" ? "border-green-400" :
              type === "error" ? "border-red-400" :
              type === "celebration" ? "border-yellow-400" :
              type === "attention" ? "border-purple-400" :
              "border-blue-400"
            )}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface InteractiveButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "default" | "success" | "error" | "celebration";
  className?: string;
  disabled?: boolean;
}

export function InteractiveButton({
  children,
  onClick,
  variant = "default",
  className,
  disabled = false
}: InteractiveButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleClick = () => {
    if (disabled) return;
    
    setIsPressed(true);
    onClick?.();
    
    // Show success animation for success variant
    if (variant === "success") {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    }
    
    setTimeout(() => setIsPressed(false), 150);
  };

  return (
    <motion.div className="relative">
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        animate={{
          scale: isPressed ? 0.95 : 1,
          transition: { duration: 0.1 }
        }}
      >
        <Button
          onClick={handleClick}
          disabled={disabled}
          className={cn(
            "relative overflow-hidden transition-all duration-200",
            variant === "success" && "hover:bg-green-500 focus:bg-green-500",
            variant === "error" && "hover:bg-red-500 focus:bg-red-500",
            variant === "celebration" && "hover:bg-yellow-500 focus:bg-yellow-500",
            className
          )}
        >
          {children}
          
          {/* Ripple effect */}
          <AnimatePresence>
            {isPressed && (
              <motion.div
                initial={{ scale: 0, opacity: 0.5 }}
                animate={{ scale: 4, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 bg-white rounded-full"
              />
            )}
          </AnimatePresence>
        </Button>
      </motion.div>

      {/* Success micro-interaction */}
      <MicroInteraction
        type="success"
        trigger={showSuccess}
        className="absolute -top-2 -right-2"
      />
    </motion.div>
  );
}

interface FloatingNotificationProps {
  message: string;
  type: "success" | "error" | "info" | "warning";
  show: boolean;
  onClose: () => void;
  duration?: number;
}

export function FloatingNotification({
  message,
  type,
  show,
  onClose,
  duration = 3000
}: FloatingNotificationProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  const getConfig = () => {
    switch (type) {
      case "success":
        return {
          icon: Check,
          color: "text-green-600",
          bgColor: "bg-green-50 border-green-200",
          accentColor: "bg-green-500"
        };
      case "error":
        return {
          icon: X,
          color: "text-red-600",
          bgColor: "bg-red-50 border-red-200",
          accentColor: "bg-red-500"
        };
      case "warning":
        return {
          icon: Bell,
          color: "text-yellow-600",
          bgColor: "bg-yellow-50 border-yellow-200",
          accentColor: "bg-yellow-500"
        };
      default:
        return {
          icon: Star,
          color: "text-blue-600",
          bgColor: "bg-blue-50 border-blue-200",
          accentColor: "bg-blue-500"
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 20 
          }}
          className={cn(
            "fixed top-4 right-4 z-50 max-w-sm p-4 rounded-lg border shadow-lg",
            config.bgColor
          )}
        >
          {/* Progress Bar */}
          <motion.div
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: duration / 1000, ease: "linear" }}
            className={cn("absolute top-0 left-0 h-1 rounded-t-lg", config.accentColor)}
          />

          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2 }}
              className="flex-shrink-0"
            >
              <Icon className={cn("h-5 w-5", config.color)} />
            </motion.div>
            
            <p className="text-sm font-medium text-gray-900">{message}</p>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-0 h-auto hover:bg-transparent"
            >
              <X className="h-4 w-4 text-gray-500" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}