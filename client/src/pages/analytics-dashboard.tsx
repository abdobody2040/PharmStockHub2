import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { StockItem, StockMovement, User, Category } from "@shared/schema";
import { Loader2, Download, ArrowDownRight, ArrowRight, ArrowUpRight, Package, MoveHorizontal, Users, Calendar, Truck, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { getExpiryStatus } from "@/lib/utils";
import { format, addMonths, addDays, isBefore, differenceInDays } from "date-fns";

export default function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState("6m");
  const [predictMonths, setPredictMonths] = useState(3);
  
  const { data: stockItems = [], isLoading: isLoadingItems } = useQuery<StockItem[]>({
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
    queryKey: ["/api/stock-items/expiring"],
  });
  
  // Filter movements by selected time range
  const getTimeFilteredMovements = () => {
    const now = new Date();
    let startDate: Date;
    
    switch(timeRange) {
      case "1m":
        startDate = addMonths(now, -1);
        break;
      case "3m":
        startDate = addMonths(now, -3);
        break;
      case "1y":
        startDate = addMonths(now, -12);
        break;
      case "6m":
      default:
        startDate = addMonths(now, -6);
    }
    
    return movements.filter(movement => {
      const movementDate = movement.movedAt ? new Date(movement.movedAt) : new Date();
      return isBefore(startDate, movementDate);
    });
  };
  
  const timeFilteredMovements = getTimeFilteredMovements();
  
  // Prepare data for stock level chart
  const getStockLevelData = () => {
    // Group by month and sum quantities
    const monthlyData = new Map();
    
    timeFilteredMovements.forEach(movement => {
      const date = movement.movedAt ? new Date(movement.movedAt) : new Date();
      const monthKey = format(date, 'MMM yyyy');
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { total: 0, in: 0, out: 0, month: monthKey });
      }
      
      const entry = monthlyData.get(monthKey);
      // Determine type based on userId fields - if fromUserId exists, it's a return; otherwise allocation
      if (movement.fromUserId === null) {
        entry.out += movement.quantity; // Allocation (going out)
      } else {
        entry.in += movement.quantity;  // Return (coming in)
      }
      
      entry.total = entry.in - entry.out;
    });
    
    // Sort by date
    return Array.from(monthlyData.values()).sort((a, b) => {
      const dateA = new Date(a.month);
      const dateB = new Date(b.month);
      return dateA.getTime() - dateB.getTime();
    });
  };
  
  // Prepare data for category distribution
  const getCategoryDistributionData = () => {
    const categoryMap = new Map();
    
    stockItems.forEach(item => {
      const category = categories.find(c => c.id === item.categoryId);
      if (category) {
        const categoryName = category.name;
        if (!categoryMap.has(categoryName)) {
          categoryMap.set(categoryName, { name: categoryName, value: 0, color: category.color || "#cbd5e1" });
        }
        categoryMap.get(categoryName).value += item.quantity;
      }
    });
    
    return Array.from(categoryMap.values());
  };
  
  // Generate predictive data
  const generatePredictiveData = () => {
    // Use simple linear regression for prediction
    const stockLevelData = getStockLevelData();
    
    if (stockLevelData.length < 2) {
      return [];
    }
    
    // Calculate rate of change from historical data
    const monthlyRateOfChange = stockLevelData.length > 1 
      ? (stockLevelData[stockLevelData.length - 1].total - stockLevelData[0].total) / stockLevelData.length
      : 0;
    
    const lastMonth = stockLevelData[stockLevelData.length - 1];
    const predictedData = [];
    
    let lastTotal = lastMonth.total;
    
    // Generate future months
    for (let i = 1; i <= predictMonths; i++) {
      const currentDate = new Date();
      const futureDate = addMonths(currentDate, i);
      const monthKey = format(futureDate, 'MMM yyyy');
      
      lastTotal += monthlyRateOfChange;
      
      predictedData.push({
        month: monthKey,
        projected: Math.round(lastTotal),
        isPrediction: true
      });
    }
    
    // Combine historical and predicted data
    return [...stockLevelData, ...predictedData];
  };
  
  // Calculate top movers (items with most movement activity)
  const getTopMovers = () => {
    const itemMovement = new Map();
    
    timeFilteredMovements.forEach(movement => {
      const itemId = movement.stockItemId;
      if (!itemMovement.has(itemId)) {
        itemMovement.set(itemId, { 
          id: itemId, 
          totalMovements: 0,
          totalQuantity: 0,
          allocations: 0,
          returns: 0
        });
      }
      
      const entry = itemMovement.get(itemId);
      entry.totalMovements += 1;
      entry.totalQuantity += movement.quantity;
      
      // Similar to before, determine movement type based on userId fields
      if (movement.fromUserId === null) {
        entry.allocations += movement.quantity; // Allocation (going out)
      } else {
        entry.returns += movement.quantity;     // Return (coming in)
      }
    });
    
    // Convert to array and add item details
    const movementArray = Array.from(itemMovement.values()).map(entry => {
      const item = stockItems.find(item => item.id === entry.id);
      return {
        ...entry,
        name: item ? item.name : `Item ${entry.id}`,
        currentStock: item ? item.quantity : 0
      };
    });
    
    // Sort by total movements (descending)
    return movementArray.sort((a, b) => b.totalMovements - a.totalMovements).slice(0, 5);
  };
  
  // Calculate inventory health metrics
  const getInventoryHealthMetrics = () => {
    if (stockItems.length === 0) return null;
    
    const totalItems = stockItems.length;
    const lowStockItems = stockItems.filter(item => item.quantity < 10).length;
    const outOfStockItems = stockItems.filter(item => item.quantity === 0).length;
    const expiringItemsCount = expiringItems.length;
    
    const lowStockPercentage = Math.round((lowStockItems / totalItems) * 100);
    const expiringPercentage = Math.round((expiringItemsCount / totalItems) * 100);
    const outOfStockPercentage = Math.round((outOfStockItems / totalItems) * 100);
    
    // Calculate inventory turnover rate (simplified)
    const totalAllocated = timeFilteredMovements
      .filter(m => m.fromUserId === null) // Only allocations (outgoing)
      .reduce((sum, m) => sum + m.quantity, 0);
    
    const avgInventory = stockItems.reduce((sum, item) => sum + item.quantity, 0) / 2; // Simplified average
    const turnoverRate = avgInventory > 0 ? (totalAllocated / avgInventory).toFixed(2) : 0;
    
    return {
      lowStockPercentage,
      expiringPercentage,
      outOfStockPercentage,
      turnoverRate
    };
  };
  
  // Calculate user activity metrics
  const getUserActivityMetrics = () => {
    const userActivity = new Map();
    
    users.forEach(user => {
      userActivity.set(user.id, { 
        id: user.id,
        name: user.name,
        role: user.role,
        movements: 0,
        totalQuantity: 0
      });
    });
    
    timeFilteredMovements.forEach(movement => {
      const userId = movement.fromUserId || movement.toUserId;
      if (userId && userActivity.has(userId)) {
        const user = userActivity.get(userId);
        user.movements += 1;
        user.totalQuantity += movement.quantity;
      }
    });
    
    return Array.from(userActivity.values())
      .filter(user => user.movements > 0)
      .sort((a, b) => b.movements - a.movements)
      .slice(0, 5);
  };
  
  // Generate restock recommendations
  const getRestockRecommendations = () => {
    return stockItems
      .filter(item => item.quantity < 10)
      .map(item => {
        const movementsForItem = timeFilteredMovements.filter(m => m.stockItemId === item.id);
        const allocationRate = movementsForItem
          .filter(m => m.fromUserId === null) // Only count outgoing movements
          .reduce((sum, m) => sum + m.quantity, 0) / (timeRange === '1m' ? 1 : timeRange === '3m' ? 3 : timeRange === '6m' ? 6 : 12);
        
        const recommendedRestock = Math.ceil(allocationRate * 2); // 2 months supply
        
        return {
          id: item.id,
          name: item.name,
          currentStock: item.quantity,
          allocationRate: Math.round(allocationRate),
          recommendedRestock: Math.max(recommendedRestock, 10) // Minimum 10 units
        };
      })
      .sort((a, b) => a.currentStock - b.currentStock); // Sort by lowest stock first
  };
  
  // Inventory metrics
  const inventoryHealth = getInventoryHealthMetrics();
  const stockLevelData = getStockLevelData();
  const categoryDistribution = getCategoryDistributionData();
  const topMovers = getTopMovers();
  const userActivity = getUserActivityMetrics();
  const restockRecommendations = getRestockRecommendations();
  const predictiveData = generatePredictiveData();
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  
  if (isLoadingItems) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[80vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h1>
            <p className="text-muted-foreground">
              View insights and predictive analytics for your inventory
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Select
              value={timeRange}
              onValueChange={setTimeRange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Time Range</SelectLabel>
                  <SelectItem value="1m">Last Month</SelectItem>
                  <SelectItem value="3m">Last 3 Months</SelectItem>
                  <SelectItem value="6m">Last 6 Months</SelectItem>
                  <SelectItem value="1y">Last Year</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Overview cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Inventory
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stockItems.reduce((sum, item) => sum + item.quantity, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {stockItems.length} unique items
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Movement Rate
              </CardTitle>
              <MoveHorizontal className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {inventoryHealth ? inventoryHealth.turnoverRate : "0.00"}
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-500">
                  <ArrowUpRight className="h-4 w-4 inline mr-1" />
                  {timeFilteredMovements.length}
                </span> movements in period
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Users
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {userActivity.length}
              </div>
              <p className="text-xs text-muted-foreground">
                of {users.length} total users
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Expiring Soon
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {expiringItems.length}
              </div>
              <p className="text-xs text-muted-foreground">
                {inventoryHealth && 
                  <span className={inventoryHealth.expiringPercentage > 10 ? "text-red-500" : "text-orange-500"}>
                    {inventoryHealth.expiringPercentage}% of inventory
                  </span>
                }
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Inventory health */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory Health</CardTitle>
            <CardDescription>
              Key metrics about your current inventory status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {inventoryHealth && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div>Low Stock Items ({inventoryHealth.lowStockPercentage}%)</div>
                    <div className="text-muted-foreground">{inventoryHealth.lowStockPercentage}/100</div>
                  </div>
                  <Progress value={inventoryHealth.lowStockPercentage} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div>Expiring Items ({inventoryHealth.expiringPercentage}%)</div>
                    <div className="text-muted-foreground">{inventoryHealth.expiringPercentage}/100</div>
                  </div>
                  <Progress value={inventoryHealth.expiringPercentage} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div>Out of Stock ({inventoryHealth.outOfStockPercentage}%)</div>
                    <div className="text-muted-foreground">{inventoryHealth.outOfStockPercentage}/100</div>
                  </div>
                  <Progress value={inventoryHealth.outOfStockPercentage} className="h-2" />
                </div>
              </>
            )}
          </CardContent>
        </Card>
        
        {/* Charts section */}
        <Tabs defaultValue="inventory-trends">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="inventory-trends">Inventory Trends</TabsTrigger>
            <TabsTrigger value="category-distribution">Category Distribution</TabsTrigger>
            <TabsTrigger value="predictive-analytics">Predictive Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="inventory-trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Stock Level Trends</CardTitle>
                <CardDescription>
                  Inventory levels over time
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {stockLevelData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={stockLevelData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="in" name="Incoming" stroke="#8884d8" />
                      <Line type="monotone" dataKey="out" name="Outgoing" stroke="#82ca9d" />
                      <Line type="monotone" dataKey="total" name="Net Change" stroke="#ff7300" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No data available for selected time range</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Top Movers</CardTitle>
                  <CardDescription>
                    Items with highest movement activity
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {topMovers.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={topMovers}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={100} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="allocations" name="Allocated" fill="#8884d8" />
                        <Bar dataKey="returns" name="Returned" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">No movement data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>User Activity</CardTitle>
                  <CardDescription>
                    Most active users by movement count
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {userActivity.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={userActivity}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="movements" name="Movements" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">No user activity data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="category-distribution">
            <Card>
              <CardHeader>
                <CardTitle>Inventory by Category</CardTitle>
                <CardDescription>
                  Distribution of inventory across categories
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                {categoryDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No category data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="predictive-analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Projected Inventory Levels</CardTitle>
                    <CardDescription>
                      Predicted inventory levels for the next {predictMonths} months
                    </CardDescription>
                  </div>
                  <Select
                    value={predictMonths.toString()}
                    onValueChange={(value) => setPredictMonths(parseInt(value))}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Prediction months" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Prediction Period</SelectLabel>
                        <SelectItem value="1">1 Month</SelectItem>
                        <SelectItem value="3">3 Months</SelectItem>
                        <SelectItem value="6">6 Months</SelectItem>
                        <SelectItem value="12">12 Months</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="h-[300px]">
                {predictiveData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={predictiveData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="total" 
                        name="Historical" 
                        stroke="#8884d8"
                        strokeWidth={2}
                        dot={true}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="projected" 
                        name="Projected" 
                        stroke="#ff7300" 
                        strokeDasharray="5 5"
                        strokeWidth={2}
                        dot={true}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">
                      Not enough historical data for predictions
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">
                  Predictions are based on historical data patterns and may not account for seasonal variations or market changes
                </p>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Restock Recommendations</CardTitle>
                <CardDescription>
                  AI-driven recommendations for low stock items
                </CardDescription>
              </CardHeader>
              <CardContent>
                {restockRecommendations.length > 0 ? (
                  <div className="space-y-4">
                    {restockRecommendations.slice(0, 5).map((item) => (
                      <div key={item.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium">{item.name}</h3>
                          <Button size="sm" variant="outline">
                            <Truck className="mr-2 h-4 w-4" />
                            Restock
                          </Button>
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Current Stock</p>
                            <p className={item.currentStock < 5 ? "text-red-500 font-medium" : ""}>
                              {item.currentStock} units
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Usage Rate</p>
                            <p>{item.allocationRate} units/month</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Recommended</p>
                            <p className="text-primary font-medium">{item.recommendedRestock} units</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {restockRecommendations.length > 5 && (
                      <Button variant="link" className="w-full">
                        View All Recommendations
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No restock recommendations available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}