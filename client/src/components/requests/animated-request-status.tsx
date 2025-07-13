import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Package, 
  ArrowRight,
  User,
  FileText
} from "lucide-react";

interface AnimatedRequestStatusProps {
  status: string;
  type: string;
  className?: string;
  showTransition?: boolean;
}

const statusConfig = {
  pending: {
    icon: Clock,
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    label: "Pending",
    bgColor: "from-yellow-50 to-yellow-100"
  },
  pending_secondary: {
    icon: AlertCircle,
    color: "bg-orange-100 text-orange-800 border-orange-200",
    label: "Pending Secondary",
    bgColor: "from-orange-50 to-orange-100"
  },
  approved: {
    icon: CheckCircle,
    color: "bg-green-100 text-green-800 border-green-200",
    label: "Approved",
    bgColor: "from-green-50 to-green-100"
  },
  denied: {
    icon: XCircle,
    color: "bg-red-100 text-red-800 border-red-200",
    label: "Denied",
    bgColor: "from-red-50 to-red-100"
  },
  completed: {
    icon: Package,
    color: "bg-blue-100 text-blue-800 border-blue-200",
    label: "Completed",
    bgColor: "from-blue-50 to-blue-100"
  }
};

const typeConfig = {
  prepare_order: {
    icon: Package,
    label: "Prepare Order",
    color: "text-blue-600"
  },
  inventory_share: {
    icon: ArrowRight,
    label: "Inventory Share",
    color: "text-purple-600"
  },
  receive_inventory: {
    icon: FileText,
    label: "Receive Inventory",
    color: "text-green-600"
  }
};

export function AnimatedRequestStatus({ 
  status, 
  type, 
  className, 
  showTransition = true 
}: AnimatedRequestStatusProps) {
  const config = statusConfig[status as keyof typeof statusConfig];
  const typeConf = typeConfig[type as keyof typeof typeConfig];
  
  if (!config) return null;

  const Icon = config.icon;
  const TypeIcon = typeConf?.icon || User;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 30,
        duration: 0.3
      }}
      className={cn("relative", className)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={status}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="relative"
        >
          {/* Status Badge */}
          <Badge 
            variant="outline" 
            className={cn(
              "relative overflow-hidden transition-all duration-300 hover:shadow-md",
              config.color
            )}
          >
            <motion.div
              className={cn(
                "absolute inset-0 bg-gradient-to-r opacity-10",
                config.bgColor
              )}
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ 
                repeat: Infinity, 
                duration: 2, 
                ease: "linear",
                repeatDelay: 3
              }}
            />
            
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ 
                repeat: status === "pending" ? Infinity : 0,
                duration: 2,
                ease: "linear"
              }}
              className="mr-2"
            >
              <Icon className="h-3 w-3" />
            </motion.div>
            
            <span className="relative z-10 font-medium">
              {config.label}
            </span>
          </Badge>

          {/* Type Badge */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-1"
          >
            <Badge variant="secondary" className={cn("text-xs", typeConf?.color)}>
              <TypeIcon className="h-2 w-2 mr-1" />
              {typeConf?.label}
            </Badge>
          </motion.div>

          {/* Animated Progress Indicator */}
          {showTransition && (
            <motion.div
              className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-30"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}