import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ChartContainerProps {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function ChartContainer({
  title,
  action,
  children,
  className
}: ChartContainerProps) {
  return (
    <Card className={cn("shadow", className)}>
      <CardHeader className="px-6 py-4 border-b border-gray-200 flex justify-between items-center space-y-0">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
        {action}
      </CardHeader>
      <CardContent className="p-6">
        {children}
      </CardContent>
    </Card>
  );
}
