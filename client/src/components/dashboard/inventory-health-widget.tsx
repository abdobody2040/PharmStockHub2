import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, TrendingUp, TrendingDown, Package } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { StockItem } from "@shared/schema";

interface InventoryHealthMetrics {
  totalItems: number;
  lowStockItems: number;
  expiringItems: number;
  healthScore: number;
  categoryBreakdown: {
    name: string;
    count: number;
    lowStock: number;
  }[];
}

export function InventoryHealthWidget() {
  const { data: stockItems = [] } = useQuery<StockItem[]>({
    queryKey: ["/api/stock-items"],
  });

  const { data: expiringItems = [] } = useQuery<StockItem[]>({
    queryKey: ["/api/stock-items/expiring"],
  });

  // Calculate health metrics
  const metrics: InventoryHealthMetrics = {
    totalItems: stockItems.length,
    lowStockItems: stockItems.filter(item => item.quantity <= 10).length, // Using quantity field for low stock
    expiringItems: expiringItems.length,
    healthScore: stockItems.length > 0 
      ? Math.round(((stockItems.length - stockItems.filter(item => 
          item.quantity <= 10 || 
          expiringItems.some(exp => exp.id === item.id)
        ).length) / stockItems.length) * 100)
      : 100,
    categoryBreakdown: []
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getHealthIcon = (score: number) => {
    if (score >= 80) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (score >= 60) return <Package className="h-4 w-4 text-yellow-600" />;
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Overall Health Score */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Inventory Health</CardTitle>
          {getHealthIcon(metrics.healthScore)}
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <div className={`text-2xl font-bold ${getHealthColor(metrics.healthScore)}`}>
              {metrics.healthScore}%
            </div>
          </div>
          <Progress value={metrics.healthScore} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-1">
            Overall inventory condition
          </p>
        </CardContent>
      </Card>

      {/* Total Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Items</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.totalItems}</div>
          <p className="text-xs text-muted-foreground">
            Items in inventory
          </p>
        </CardContent>
      </Card>

      {/* Low Stock Alert */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{metrics.lowStockItems}</div>
          <p className="text-xs text-muted-foreground">
            Items need restocking
          </p>
          {metrics.lowStockItems > 0 && (
            <Badge variant="outline" className="mt-2 text-yellow-600 border-yellow-600">
              Action Required
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Expiring Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{metrics.expiringItems}</div>
          <p className="text-xs text-muted-foreground">
            Items expiring in 30 days
          </p>
          {metrics.expiringItems > 0 && (
            <Badge variant="outline" className="mt-2 text-red-600 border-red-600">
              Urgent
            </Badge>
          )}
        </CardContent>
      </Card>
    </div>
  );
}