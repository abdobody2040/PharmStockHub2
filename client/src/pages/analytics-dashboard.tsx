import { useState, useEffect, useRef } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { StockItem, StockMovement, Category } from "@shared/schema";
import Chart from "chart.js/auto";
import { BarChart, LineChart, TrendingUp, TrendingDown, Calendar, AlertCircle, Target, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { getExpiryStatusColor, truncateText } from "@/lib/utils";

export default function AnalyticsDashboard() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<"week" | "month" | "quarter" | "year">("month");
  const [activeTab, setActiveTab] = useState("predictive");
  const consumptionChartRef = useRef<HTMLCanvasElement>(null);
  const allocationChartRef = useRef<HTMLCanvasElement>(null);
  const predictionChartRef = useRef<HTMLCanvasElement>(null);
  const consumptionChart = useRef<Chart | null>(null);
  const allocationChart = useRef<Chart | null>(null);
  const predictionChart = useRef<Chart | null>(null);

  // Fetch data for analytics
  const { data: stockItems = [] } = useQuery<StockItem[]>({
    queryKey: ["/api/stock-items"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: movements = [] } = useQuery<StockMovement[]>({
    queryKey: ["/api/movements"],
  });

  // Initialize charts whenever data or time range changes
  useEffect(() => {
    if (consumptionChartRef.current) {
      // Clean up previous chart
      if (consumptionChart.current) {
        consumptionChart.current.destroy();
      }

      // Sample data for consumption trends
      const labels = timeRange === "week" 
        ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        : timeRange === "month"
        ? ["Week 1", "Week 2", "Week 3", "Week 4"]
        : timeRange === "quarter"
        ? ["Jan", "Feb", "Mar"]
        : ["Q1", "Q2", "Q3", "Q4"];

      // Get top categories
      const topCategories = categories.slice(0, 3);
      
      // Simulate consumption data for each category
      const datasets = topCategories.map((category, index) => {
        // Generate random consumption data based on time range
        const data = labels.map(() => Math.floor(Math.random() * 500) + 100);
        
        // Colors for chart
        const colors = [
          { border: 'rgb(59, 130, 246)', background: 'rgba(59, 130, 246, 0.2)' }, // blue
          { border: 'rgb(16, 185, 129)', background: 'rgba(16, 185, 129, 0.2)' }, // green
          { border: 'rgb(139, 92, 246)', background: 'rgba(139, 92, 246, 0.2)' }, // purple
        ];
        
        return {
          label: category.name,
          data: data,
          borderColor: colors[index].border,
          backgroundColor: colors[index].background,
          borderWidth: 2,
          tension: 0.3,
          fill: true
        };
      });

      // Create consumption chart
      const ctx = consumptionChartRef.current.getContext('2d');
      if (ctx) {
        consumptionChart.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: labels,
            datasets: datasets
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                position: 'top',
              },
              title: {
                display: true,
                text: 'Consumption Trends by Category'
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Units'
                }
              }
            }
          }
        });
      }
    }

    if (allocationChartRef.current) {
      // Clean up previous chart
      if (allocationChart.current) {
        allocationChart.current.destroy();
      }

      // Sample data for allocations by region
      const regions = ["North", "South", "East", "West", "Central"];
      const allocations = regions.map(() => Math.floor(Math.random() * 1000) + 200);

      // Create allocation chart
      const ctx = allocationChartRef.current.getContext('2d');
      if (ctx) {
        allocationChart.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: regions,
            datasets: [{
              label: 'Allocated Units',
              data: allocations,
              backgroundColor: [
                'rgba(59, 130, 246, 0.7)', // blue
                'rgba(16, 185, 129, 0.7)', // green
                'rgba(139, 92, 246, 0.7)', // purple
                'rgba(245, 158, 11, 0.7)', // amber
                'rgba(236, 72, 153, 0.7)', // pink
              ],
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                display: false
              },
              title: {
                display: true,
                text: 'Allocations by Region'
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Units'
                }
              }
            }
          }
        });
      }
    }

    if (predictionChartRef.current) {
      // Clean up previous chart
      if (predictionChart.current) {
        predictionChart.current.destroy();
      }

      // Sample data for predictive analytics
      let labels: string[] = [];
      const currentMonth = new Date().getMonth();
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      
      // Show 3 months of historical data and 3 months of predictions
      for (let i = -3; i <= 3; i++) {
        const monthIndex = (currentMonth + i + 12) % 12; // Ensure we wrap around correctly
        labels.push(months[monthIndex]);
      }

      // Historical data (past 3 months) and predicted data (next 3 months) for a product
      const historicalData = [320, 350, 380]; // Last 3 months
      const predictedData = [410, 435, 470, 500]; // Current month and future 3 months
      
      // Create prediction chart
      const ctx = predictionChartRef.current.getContext('2d');
      if (ctx) {
        predictionChart.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [
              {
                label: 'Historical Demand',
                data: [...historicalData, null, null, null, null], // Pad with nulls for future months
                borderColor: 'rgb(59, 130, 246)', // blue
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                borderWidth: 2,
                pointStyle: 'circle',
                pointRadius: 5,
                fill: true
              },
              {
                label: 'Predicted Demand',
                data: [null, null, null, ...predictedData], // Pad with nulls for past months
                borderColor: 'rgb(236, 72, 153)', // pink
                backgroundColor: 'rgba(236, 72, 153, 0.2)',
                borderWidth: 2,
                borderDash: [5, 5],
                pointStyle: 'triangle',
                pointRadius: 5,
                fill: true
              }
            ]
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                position: 'top',
              },
              title: {
                display: true,
                text: 'Demand Prediction Analysis'
              },
              tooltip: {
                callbacks: {
                  title: function(context) {
                    const index = context[0].dataIndex;
                    const isHistorical = index < 3;
                    return `${labels[index]} (${isHistorical ? 'Historical' : 'Predicted'})`;
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: false,
                title: {
                  display: true,
                  text: 'Units'
                }
              }
            }
          }
        });
      }
    }

    // Cleanup function
    return () => {
      if (consumptionChart.current) {
        consumptionChart.current.destroy();
      }
      if (allocationChart.current) {
        allocationChart.current.destroy();
      }
      if (predictionChart.current) {
        predictionChart.current.destroy();
      }
    };
  }, [timeRange, categories, stockItems, movements]);

  // Calculate analytics metrics
  const totalStock = stockItems.reduce((sum, item) => sum + item.quantity, 0);
  const lowStockItems = stockItems.filter(item => item.quantity < 10).length;
  const lowStockPercentage = (lowStockItems / (stockItems.length || 1)) * 100;

  // Get top moving items based on movement records
  const itemCounts = movements.reduce((acc, movement) => {
    const itemId = movement.stockItemId;
    acc[itemId] = (acc[itemId] || 0) + movement.quantity;
    return acc;
  }, {} as Record<number, number>);

  const topMovingItems = Object.entries(itemCounts)
    .map(([itemId, count]) => ({
      item: stockItems.find(item => item.id === parseInt(itemId)),
      count
    }))
    .filter(entry => entry.item) // Filter out undefined items
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Advanced Analytics</h2>
        <Select value={timeRange} onValueChange={(value) => setTimeRange(value as any)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Time Range</SelectLabel>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Inventory</p>
                <h3 className="text-2xl font-bold mt-1">{totalStock.toLocaleString()}</h3>
              </div>
              <div className="p-2 bg-blue-100 rounded-full">
                <BarChart className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center">
              <span className="text-xs text-green-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12.5%
              </span>
              <span className="text-xs text-gray-500 ml-2">vs. previous period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Stock Turnover</p>
                <h3 className="text-2xl font-bold mt-1">4.2x</h3>
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <LineChart className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center">
              <span className="text-xs text-red-600 flex items-center">
                <TrendingDown className="h-3 w-3 mr-1" />
                -3.2%
              </span>
              <span className="text-xs text-gray-500 ml-2">vs. previous period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Low Stock Items</p>
                <h3 className="text-2xl font-bold mt-1">{lowStockItems}</h3>
              </div>
              <div className="p-2 bg-amber-100 rounded-full">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
            </div>
            <div className="mt-2">
              <Progress value={lowStockPercentage} className="h-1" />
              <span className="text-xs text-gray-500 mt-1 block">
                {lowStockPercentage.toFixed(1)}% of total inventory
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Forecast Accuracy</p>
                <h3 className="text-2xl font-bold mt-1">89.5%</h3>
              </div>
              <div className="p-2 bg-purple-100 rounded-full">
                <Target className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center">
              <span className="text-xs text-green-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +5.3%
              </span>
              <span className="text-xs text-gray-500 ml-2">vs. previous period</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full sm:w-auto">
          <TabsTrigger value="predictive" className="px-4">
            Predictive Insights
          </TabsTrigger>
          <TabsTrigger value="trends" className="px-4">
            Consumption Trends
          </TabsTrigger>
          <TabsTrigger value="allocation" className="px-4">
            Allocation Analysis
          </TabsTrigger>
        </TabsList>

        {/* Predictive Insights Tab */}
        <TabsContent value="predictive">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle>Demand Prediction</CardTitle>
                <CardDescription>
                  AI-powered forecast of future demand based on historical patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <canvas ref={predictionChartRef} height="320"></canvas>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Restock Recommendations</CardTitle>
                <CardDescription>
                  Smart suggestions based on predicted demand
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categories.slice(0, 4).map((category, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-sm">{category.name}</h4>
                          <p className="text-xs text-gray-500 mt-1">
                            Predicted to run low in {Math.floor(Math.random() * 30) + 5} days
                          </p>
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          index % 2 === 0 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {index % 2 === 0 ? 'Critical' : 'Warning'}
                        </span>
                      </div>
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Current: {Math.floor(Math.random() * 50) + 20} units</span>
                          <span>Recommended: {Math.floor(Math.random() * 100) + 100} units</span>
                        </div>
                        <Progress 
                          value={Math.floor(Math.random() * 40) + 10} 
                          className="h-1.5 mt-1"
                        />
                      </div>
                    </div>
                  ))}
                  
                  <Button variant="outline" className="w-full mt-2 text-sm">
                    View All Recommendations
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Seasonal Trends</CardTitle>
                <CardDescription>
                  Projected seasonal impact on demand
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                    <h4 className="font-medium text-sm">Upcoming Peak Periods</h4>
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    {["Summer Conference Season", "End of Year Reporting", "New Product Launch"].map((period, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium">{period}</p>
                          <span className="text-xs text-gray-500">{["Jun - Aug", "Oct - Dec", "Mar - Apr"][i]}</span>
                        </div>
                        <span className="text-sm font-medium text-green-600">
                          +{Math.floor(Math.random() * 30) + 15}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Inventory Risk Assessment</CardTitle>
                <CardDescription>
                  AI analysis of potential stock issues
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { risk: "Stockout Risk", categories: ["Brochures", "Samples"], level: "High" },
                    { risk: "Overstock Risk", categories: ["Posters", "USB Drives"], level: "Medium" },
                    { risk: "Expiration Risk", categories: ["Dated Materials"], level: "Low" }
                  ].map((risk, i) => (
                    <div key={i} className="border-l-4 pl-3 py-1 mb-3" style={{
                      borderColor: risk.level === "High" ? "#ef4444" : 
                                 risk.level === "Medium" ? "#f59e0b" : "#10b981"
                    }}>
                      <p className="font-medium text-sm">{risk.risk}</p>
                      <p className="text-xs text-gray-500">Categories: {risk.categories.join(", ")}</p>
                      <div className="flex items-center mt-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          risk.level === "High" ? "bg-red-100 text-red-800" :
                          risk.level === "Medium" ? "bg-yellow-100 text-yellow-800" :
                          "bg-green-100 text-green-800"
                        }`}>
                          {risk.level} Risk
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>AI Suggested Actions</CardTitle>
                <CardDescription>
                  Smart recommendations to optimize inventory
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    "Increase Brochure stock by 30% to meet projected demand spike in June",
                    "Reassign 15% of Central region USB drives to Western region to balance distribution",
                    "Begin phasing out 2023 dated materials to minimize waste"
                  ].map((action, i) => (
                    <div key={i} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex">
                        <div className="p-1.5 bg-blue-100 rounded-full mr-2">
                          <span className="text-blue-700 text-xs font-bold">{i + 1}</span>
                        </div>
                        <p className="text-sm">{action}</p>
                      </div>
                      <div className="flex justify-end mt-2">
                        <Button variant="outline" size="sm" className="h-7 text-xs mr-2">
                          Skip
                        </Button>
                        <Button size="sm" className="h-7 text-xs">
                          Apply
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Consumption Trends Tab */}
        <TabsContent value="trends">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle>Consumption Patterns</CardTitle>
                <CardDescription>
                  How different categories of promotional materials are being used over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <canvas ref={consumptionChartRef} height="320"></canvas>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Top Moving Items</CardTitle>
                <CardDescription>
                  Items with highest movement volume
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topMovingItems.map((entry, idx) => entry.item && (
                    <div key={idx} className="flex items-center py-2 border-b last:border-0">
                      <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-xs font-medium">{idx + 1}</span>
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="font-medium text-sm truncate">{entry.item.name}</p>
                        <p className="text-xs text-gray-500">
                          {categories.find(c => c.id === entry.item?.categoryId)?.name || "Uncategorized"}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="font-medium">{entry.count}</p>
                        <p className="text-xs text-gray-500">units</p>
                      </div>
                    </div>
                  ))}
                  
                  {topMovingItems.length === 0 && (
                    <div className="text-center py-6">
                      <p className="text-gray-500">No movement data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Allocation Analysis Tab */}
        <TabsContent value="allocation">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle>Allocation by Region</CardTitle>
                <CardDescription>
                  How promotional materials are distributed across regions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <canvas ref={allocationChartRef} height="320"></canvas>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Allocation Efficiency</CardTitle>
                <CardDescription>
                  Material utilization by medical representatives
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {["North", "South", "East", "West", "Central"].map((region, idx) => {
                    const efficiency = Math.floor(Math.random() * 40) + 60; // Random number between 60-100
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{region} Region</span>
                          <span className="text-sm font-medium">{efficiency}%</span>
                        </div>
                        <Progress value={efficiency} className="h-2" />
                        <p className="text-xs text-gray-500">
                          {efficiency >= 80 ? "Highly efficient" : 
                           efficiency >= 70 ? "Efficient" : 
                           "Needs improvement"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}