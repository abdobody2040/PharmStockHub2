import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { 
  Check, 
  X, 
  Eye, 
  FileText, 
  Clock, 
  MessageSquare,
  ArrowRight,
  Zap,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickActionTooltipsProps {
  request: {
    id: number;
    status: string;
    type: string;
    title: string;
    description?: string;
    requestedBy: number;
    assignedTo?: number;
  };
  onApprove?: (id: number) => void;
  onDeny?: (id: number) => void;
  onView?: (id: number) => void;
  onComment?: (id: number) => void;
  userRole?: string;
  className?: string;
}

export function QuickActionTooltips({
  request,
  onApprove,
  onDeny,
  onView,
  onComment,
  userRole,
  className
}: QuickActionTooltipsProps) {
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);

  const canApprove = request.status === "pending" && 
                    (userRole === "stockKeeper" || userRole === "admin" || userRole === "ceo");
  const canDeny = request.status === "pending" && 
                 (userRole === "stockKeeper" || userRole === "admin" || userRole === "ceo");
  const canView = true;
  const canComment = true;

  const getActionTooltip = (action: string) => {
    switch (action) {
      case "approve":
        return {
          title: "Approve Request",
          description: "Process and approve this request",
          shortcut: "Ctrl+A",
          priority: "high"
        };
      case "deny":
        return {
          title: "Deny Request",
          description: "Reject this request with reason",
          shortcut: "Ctrl+D",
          priority: "medium"
        };
      case "view":
        return {
          title: "View Details",
          description: "View complete request information",
          shortcut: "Ctrl+V",
          priority: "low"
        };
      case "comment":
        return {
          title: "Add Comment",
          description: "Add notes or feedback",
          shortcut: "Ctrl+C",
          priority: "low"
        };
      default:
        return null;
    }
  };

  const actions = [
    {
      id: "view",
      icon: Eye,
      enabled: canView,
      onClick: () => onView?.(request.id),
      color: "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
    },
    {
      id: "approve",
      icon: Check,
      enabled: canApprove,
      onClick: () => onApprove?.(request.id),
      color: "text-green-600 hover:text-green-700 hover:bg-green-50"
    },
    {
      id: "deny",
      icon: X,
      enabled: canDeny,
      onClick: () => onDeny?.(request.id),
      color: "text-red-600 hover:text-red-700 hover:bg-red-50"
    },
    {
      id: "comment",
      icon: MessageSquare,
      enabled: canComment,
      onClick: () => onComment?.(request.id),
      color: "text-gray-600 hover:text-gray-700 hover:bg-gray-50"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-600 bg-yellow-50";
      case "approved":
        return "text-green-600 bg-green-50";
      case "denied":
        return "text-red-600 bg-red-50";
      case "completed":
        return "text-blue-600 bg-blue-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <TooltipProvider>
      <div className={cn("flex items-center gap-2", className)}>
        {/* Status Indicator */}
        <div className="flex items-center gap-2 mr-2">
          <Badge variant="outline" className={cn("text-xs", getStatusColor(request.status))}>
            {request.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
            {request.status === "approved" && <Check className="h-3 w-3 mr-1" />}
            {request.status === "denied" && <X className="h-3 w-3 mr-1" />}
            {request.status === "completed" && <FileText className="h-3 w-3 mr-1" />}
            {request.status.replace("_", " ")}
          </Badge>
          
          {request.status === "pending" && (
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [1, 0.7, 1]
              }}
              transition={{ 
                repeat: Infinity,
                duration: 2
              }}
            >
              <AlertTriangle className="h-3 w-3 text-yellow-500" />
            </motion.div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {actions.map((action) => {
            if (!action.enabled) return null;
            
            const Icon = action.icon;
            const tooltipData = getActionTooltip(action.id);
            
            return (
              <Tooltip key={action.id}>
                <TooltipTrigger asChild>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onHoverStart={() => setHoveredAction(action.id)}
                    onHoverEnd={() => setHoveredAction(null)}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-8 w-8 p-0 transition-all duration-200",
                        action.color,
                        hoveredAction === action.id && "shadow-md"
                      )}
                      onClick={action.onClick}
                    >
                      <motion.div
                        animate={{ 
                          rotate: hoveredAction === action.id ? 360 : 0,
                          scale: hoveredAction === action.id ? 1.1 : 1
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        <Icon className="h-4 w-4" />
                      </motion.div>
                    </Button>
                  </motion.div>
                </TooltipTrigger>
                
                <TooltipContent 
                  side="top" 
                  className="max-w-xs"
                  sideOffset={5}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "p-1 rounded",
                        tooltipData?.priority === "high" ? "bg-red-100 text-red-600" :
                        tooltipData?.priority === "medium" ? "bg-yellow-100 text-yellow-600" :
                        "bg-blue-100 text-blue-600"
                      )}>
                        <Icon className="h-3 w-3" />
                      </div>
                      <span className="font-medium">{tooltipData?.title}</span>
                    </div>
                    
                    <p className="text-xs text-gray-600">
                      {tooltipData?.description}
                    </p>
                    
                    {tooltipData?.shortcut && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Zap className="h-3 w-3" />
                        <span>{tooltipData.shortcut}</span>
                      </div>
                    )}
                    
                    {tooltipData?.priority === "high" && (
                      <div className="flex items-center gap-1 text-xs text-red-600">
                        <AlertTriangle className="h-3 w-3" />
                        <span>High Priority Action</span>
                      </div>
                    )}
                  </motion.div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Request Progress Indicator */}
        <AnimatePresence>
          {request.status === "pending" && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="flex items-center gap-1 ml-2"
            >
              <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-blue-500 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "60%" }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <span className="text-xs text-gray-500">Processing</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  );
}