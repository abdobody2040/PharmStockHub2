import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  change?: {
    value: string | number;
    isPositive: boolean;
    text: string;
  };
  iconColor: string;
  className?: string;
}

export function StatsCard({
  icon: Icon,
  title,
  value,
  change,
  iconColor,
  className
}: StatsCardProps) {
  return (
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className={cn("p-3 rounded-full", iconColor)}>
            <Icon className="text-2xl h-6 w-6" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-semibold text-gray-800">{value}</p>
          </div>
        </div>
        
        {change && (
          <div className="mt-4">
            <div className="flex items-center">
              <span 
                className={cn(
                  "text-sm font-medium flex items-center",
                  change.isPositive ? "text-green-500" : "text-red-500"
                )}
              >
                <svg 
                  className="mr-1 h-4 w-4" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {change.isPositive ? (
                    <path 
                      d="M18 15L12 9L6 15" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  ) : (
                    <path 
                      d="M6 9L12 15L18 9" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  )}
                </svg>
                {change.value}
              </span>
              <span className="text-gray-500 text-sm ml-2">{change.text}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
