import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { StatsCard } from "@/components/dashboard/stats-card";
import { ChartContainer } from "@/components/dashboard/chart-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StockItem, Category, User, StockMovement, ROLE_PERMISSIONS } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { cn, formatDate, getExpiryStatus, getExpiryStatusColor, getCategoryColorClass, getPlaceholderAvatar } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  Clock, 
  ArrowLeftRight, 
  Users,
  ChevronRight,
  Layers,
  ShoppingCart,
  TrendingUp
} from "lucide-react";
import Chart from 'chart.js/auto';
import 'chartjs-adapter-date-fns';

export default function DashboardPage() {
  const { user } = useAuth();
  const stockMovementChartRef = useRef<HTMLCanvasElement>(null);
  const categoryChartRef = useRef<HTMLCanvasElement>(null);
  const stockMovementChart = useRef<Chart | null>(null);
  const categoryChart = useRef<Chart | null>(null);

  // Fetch necessary data
  const { data: stockItems = [] } = useQuery<StockItem[]>({
    queryKey: ["/api/stock-items"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: movements = [] } = useQuery<StockMovement[]>({
    queryKey: ["/api/movements"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: expiringItems = [] } = useQuery<StockItem[]>({
    queryKey: ["/api/stock-items/expiring", { days: 30 }],
  });

  // Prepare dashboard stats
  const totalStockItems = stockItems.length;
  const totalStockQuantity = stockItems.reduce((sum, item) => sum + item.quantity, 0);
  
  const expiringItemsCount = expiringItems.length;
  
  const stockTransfersCount = movements.length;
  
  // Calculate total stock value based on actual price data
  const totalStockValue = stockItems.reduce((sum, item) => {
    // Use actual price (stored in cents) or default to 0 if not available
    const itemPrice = item.price || 0; // in cents
    return sum + (item.quantity * itemPrice);
  }, 0);
  
  // Convert from cents to dollars and format with proper grouping
  const totalValueInDollars = totalStockValue / 100;
  const formattedStockValue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
    notation: totalValueInDollars >= 10000 ? 'compact' : 'standard'
  }).format(totalValueInDollars);
  
  // Count of medical reps (will be needed for the table section)
  const medicalRepsCount = users.filter(u => u.role === 'medicalRep').length;

  // Calculate category distribution for the chart
  const categoryCounts = categories.map(category => {
    const itemsInCategory = stockItems.filter(item => item.categoryId === category.id);
    const totalQuantity = itemsInCategory.reduce((sum, item) => sum + item.quantity, 0);
    return {
      category: category.name,
      count: itemsInCategory.length,
      quantity: totalQuantity,
      color: category.color.replace('bg-', '').replace('-500', '')
    };
  });

  // Get medical reps with most items allocated
  const topMedicalReps = users
    .filter(user => user.role === 'medicalRep')
    .slice(0, 3);

  // Initialize charts
  useEffect(() => {
    if (stockMovementChartRef.current && movements.length > 0) {
      // Clean up previous chart
      if (stockMovementChart.current) {
        stockMovementChart.current.destroy();
      }

      // Group movements by date
      const movementsByDate = movements.reduce((acc: Record<string, number>, movement) => {
        // Handle null or undefined movedAt safely
        const movedAtDate = movement.movedAt ? new Date(movement.movedAt) : new Date();
        const date = movedAtDate.toLocaleDateString();
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

      // Sort dates
      const sortedDates = Object.keys(movementsByDate).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
      const lastSevenDates = sortedDates.slice(-7);
      const counts = lastSevenDates.map(date => movementsByDate[date]);

      // Create chart
      const ctx = stockMovementChartRef.current.getContext('2d');
      if (ctx) {
        stockMovementChart.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: lastSevenDates,
            datasets: [{
              label: 'Items Transferred',
              data: counts,
              backgroundColor: '#3B82F6',
              borderColor: '#2563EB',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }
        });
      }
    }

    if (categoryChartRef.current && categoryCounts.length > 0) {
      // Clean up previous chart
      if (categoryChart.current) {
        categoryChart.current.destroy();
      }

      // Create chart
      const ctx = categoryChartRef.current.getContext('2d');
      if (ctx) {
        categoryChart.current = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: categoryCounts.map(c => c.category),
            datasets: [{
              data: categoryCounts.map(c => c.quantity),
              backgroundColor: [
                '#3B82F6', // blue
                '#10B981', // green
                '#8B5CF6', // purple
                '#F59E0B', // amber
                '#EC4899', // pink
                '#6B7280'  // gray
              ],
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                position: 'bottom',
              }
            }
          }
        });
      }
    }

    return () => {
      // Clean up charts on unmount
      if (stockMovementChart.current) {
        stockMovementChart.current.destroy();
      }
      if (categoryChart.current) {
        categoryChart.current.destroy();
      }
    };
  }, [movements, categoryCounts]);

  // Function to get a category by its ID
  const getCategoryById = (categoryId: number) => {
    return categories.find(cat => cat.id === categoryId) || { name: 'Unknown', color: 'bg-gray-500' };
  };

  return (
    <MainLayout>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h2>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          icon={Package}
          title="Total Stock Items"
          value={totalStockItems}
          change={{ value: "12%", isPositive: true, text: "from last month" }}
          iconColor="bg-primary-100 text-primary-600"
        />

        <StatsCard
          icon={Clock}
          title="Expiring Soon"
          value={expiringItemsCount}
          change={{ value: "8%", isPositive: false, text: "from last month" }}
          iconColor="bg-yellow-100 text-yellow-600"
        />

        <StatsCard
          icon={ArrowLeftRight}
          title="Stock Transfers"
          value={stockTransfersCount}
          change={{ value: "18%", isPositive: true, text: "from last week" }}
          iconColor="bg-green-100 text-green-600"
        />

        <StatsCard
          icon={TrendingUp}
          title="Inventory Value"
          value={formattedStockValue}
          change={{ value: "7%", isPositive: true, text: "from last month" }}
          iconColor="bg-emerald-100 text-emerald-600"
        />
      </div>

      {/* Charts and tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stock Movement Chart */}
        <ChartContainer 
          title="Recent Stock Movements"
          className="lg:col-span-2"
        >
          <canvas ref={stockMovementChartRef} height="200"></canvas>
        </ChartContainer>

        {/* Category Distribution Chart */}
        <ChartContainer title="Stock by Category">
          <canvas ref={categoryChartRef} height="200"></canvas>
        </ChartContainer>

        {/* Expiring Items Table */}
        <Card className="lg:col-span-2">
          <CardHeader className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
            <CardTitle className="text-lg font-medium">Expiring Items</CardTitle>
            <Button variant="link" className="text-sm text-primary">
              View All
            </Button>
          </CardHeader>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expiringItems.slice(0, 3).map((item) => {
                    const category = getCategoryById(item.categoryId);
                    const expiryStatus = getExpiryStatus(item.expiry);
                    const statusColor = getExpiryStatusColor(expiryStatus);
                    const daysRemaining = item.expiry ? Math.ceil((new Date(item.expiry).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : null;
                    
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              {item.imageUrl ? (
                                <img 
                                  src={item.imageUrl} 
                                  alt={item.name} 
                                  className="h-10 w-10 rounded object-cover" 
                                />
                              ) : (
                                <div className="h-10 w-10 rounded bg-gray-200 flex items-center justify-center">
                                  <Package className="h-5 w-5 text-gray-500" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{item.name}</div>
                              <div className="text-sm text-gray-500">{item.uniqueNumber}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-900">{category.name}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-900">{formatDate(item.expiry)}</div>
                          {daysRemaining !== null && (
                            <div className={cn("text-sm", daysRemaining <= 14 ? "text-red-500" : daysRemaining <= 30 ? "text-orange-500" : "text-green-500")}>
                              {daysRemaining < 0 ? 'Expired' : `In ${daysRemaining} days`}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-900">{item.quantity}</div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline"
                            className={cn(
                              "font-medium",
                              statusColor
                            )}
                          >
                            {expiryStatus === 'critical' ? 'Critical' : 
                             expiryStatus === 'warning' ? 'Warning' : 
                             expiryStatus === 'safe' ? 'Safe' : 
                             expiryStatus === 'expired' ? 'Expired' : 'Unknown'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Metrics */}
        <div className="space-y-4">
          {/* Low Stock Items */}
          <Card>
            <CardHeader className="px-6 py-4 border-b border-gray-200">
              <CardTitle className="text-lg font-medium">Low Stock Items</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ul className="space-y-3">
                {stockItems.filter(item => item.quantity <= 10).slice(0, 3).map((item) => (
                  <li key={item.id} className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded bg-red-100 flex items-center justify-center">
                        <Package className="h-4 w-4 text-red-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{item.name}</p>
                        <p className="text-xs text-red-600">Only {item.quantity} left</p>
                      </div>
                    </div>
                    <Badge variant="destructive">Low Stock</Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card>
            <CardHeader className="px-6 py-4 border-b border-gray-200">
              <CardTitle className="text-lg font-medium">Category Distribution</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ul className="space-y-2">
                {categoryCounts.slice(0, 3).map((cat) => (
                  <li key={cat.category} className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className={`h-3 w-3 rounded-full bg-${cat.color}-500 mr-2`} />
                      <span className="text-sm text-gray-600">{cat.category}</span>
                    </div>
                    <span className="text-sm font-medium">{cat.quantity} items</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
