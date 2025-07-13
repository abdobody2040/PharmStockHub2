import { useState, useRef } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  X, 
  Filter, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Package, 
  AlertCircle,
  Plus,
  Sparkles
} from "lucide-react";

interface FilterChip {
  id: string;
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  count?: number;
}

interface InteractiveFilterChipsProps {
  activeFilters: string[];
  onFilterChange: (filters: string[]) => void;
  totalCounts: Record<string, number>;
  className?: string;
}

const filterOptions: FilterChip[] = [
  {
    id: "all",
    label: "All Requests",
    value: "all",
    icon: Package,
    color: "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
  },
  {
    id: "pending",
    label: "Pending",
    value: "pending",
    icon: Clock,
    color: "bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200"
  },
  {
    id: "pending_secondary",
    label: "Pending Secondary",
    value: "pending_secondary",
    icon: AlertCircle,
    color: "bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200"
  },
  {
    id: "approved",
    label: "Approved",
    value: "approved",
    icon: CheckCircle,
    color: "bg-green-100 text-green-700 border-green-300 hover:bg-green-200"
  },
  {
    id: "denied",
    label: "Denied",
    value: "denied",
    icon: XCircle,
    color: "bg-red-100 text-red-700 border-red-300 hover:bg-red-200"
  },
  {
    id: "completed",
    label: "Completed",
    value: "completed",
    icon: Package,
    color: "bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200"
  }
];

export function InteractiveFilterChips({
  activeFilters,
  onFilterChange,
  totalCounts,
  className
}: InteractiveFilterChipsProps) {
  const [draggedFilter, setDraggedFilter] = useState<string | null>(null);
  const [showAllFilters, setShowAllFilters] = useState(false);
  const constraintsRef = useRef<HTMLDivElement>(null);

  const handleFilterToggle = (filterId: string) => {
    if (filterId === "all") {
      onFilterChange([]);
    } else {
      const newFilters = activeFilters.includes(filterId)
        ? activeFilters.filter(f => f !== filterId)
        : [...activeFilters, filterId];
      onFilterChange(newFilters);
    }
  };

  const handleDragEnd = (event: any, info: PanInfo, filterId: string) => {
    // Simple drag to remove functionality
    if (Math.abs(info.offset.y) > 50) {
      const newFilters = activeFilters.filter(f => f !== filterId);
      onFilterChange(newFilters);
    }
    setDraggedFilter(null);
  };

  const clearAllFilters = () => {
    onFilterChange([]);
  };

  const visibleFilters = showAllFilters ? filterOptions : filterOptions.slice(0, 4);
  const isActive = (filterId: string) => 
    filterId === "all" ? activeFilters.length === 0 : activeFilters.includes(filterId);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Filter Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filter Requests</span>
        </div>
        
        {activeFilters.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-auto p-1 text-xs text-gray-500 hover:text-gray-700"
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Filter Chips Container */}
      <div 
        ref={constraintsRef}
        className="flex flex-wrap gap-2 p-2 min-h-[60px] bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 transition-colors duration-200"
      >
        <AnimatePresence mode="wait">
          {visibleFilters.map((filter) => {
            const Icon = filter.icon;
            const count = totalCounts[filter.value] || 0;
            const active = isActive(filter.id);
            
            return (
              <motion.div
                key={filter.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                drag={active && filter.id !== "all"}
                dragConstraints={constraintsRef}
                dragElastic={0.2}
                onDragStart={() => setDraggedFilter(filter.id)}
                onDragEnd={(event, info) => handleDragEnd(event, info, filter.id)}
                className={cn(
                  "cursor-pointer select-none",
                  draggedFilter === filter.id && "z-10"
                )}
              >
                <Badge
                  variant="outline"
                  className={cn(
                    "relative overflow-hidden transition-all duration-300 hover:shadow-md",
                    filter.color,
                    active && "ring-2 ring-blue-500 ring-offset-1",
                    draggedFilter === filter.id && "rotate-3 shadow-lg"
                  )}
                  onClick={() => handleFilterToggle(filter.id)}
                >
                  {/* Background Animation */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"
                    initial={{ x: "-100%" }}
                    animate={{ x: active ? "100%" : "-100%" }}
                    transition={{ 
                      repeat: active ? Infinity : 0,
                      duration: 2,
                      ease: "linear"
                    }}
                  />
                  
                  {/* Content */}
                  <div className="flex items-center gap-2 relative z-10">
                    <motion.div
                      animate={{ rotate: active ? 360 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Icon className="h-3 w-3" />
                    </motion.div>
                    
                    <span className="font-medium">{filter.label}</span>
                    
                    {count > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex items-center justify-center w-5 h-5 bg-white/80 rounded-full text-xs font-bold"
                      >
                        {count}
                      </motion.div>
                    )}
                    
                    {active && filter.id !== "all" && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        whileHover={{ scale: 1.2 }}
                        className="ml-1 hover:bg-white/50 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </motion.div>
                    )}
                  </div>
                </Badge>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Add More Filters Button */}
        {!showAllFilters && filterOptions.length > 4 && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAllFilters(true)}
            className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium hover:bg-blue-100 transition-colors"
          >
            <Plus className="h-3 w-3" />
            More
          </motion.button>
        )}
      </div>

      {/* Active Filters Summary */}
      <AnimatePresence>
        {activeFilters.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 text-sm text-gray-600"
          >
            <Sparkles className="h-4 w-4 text-blue-500" />
            <span>
              Showing {activeFilters.length} filter{activeFilters.length !== 1 ? "s" : ""} applied
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drag Instructions */}
      <AnimatePresence>
        {draggedFilter && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="text-xs text-gray-500 text-center"
          >
            Drag up or down to remove filter
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}