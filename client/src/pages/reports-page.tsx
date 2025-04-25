import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { ReportForm } from "@/components/reports/report-form";
import { 
  FileDown, 
  FileText,
  BarChart4,
  BarChart, 
  PieChart
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { 
  StockItem, 
  StockMovement, 
  Category 
} from "@shared/schema";
import Chart from 'chart.js/auto';
import { useEffect, useRef } from "react";

export default function ReportsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportType, setReportType] = useState("inventory");
  const [dateRange, setDateRange] = useState("month");
  const inventoryChartRef = useRef<HTMLCanvasElement>(null);
  const categoryChartRef = useRef<HTMLCanvasElement>(null);
  const inventoryChart = useRef<Chart | null>(null);
  const categoryChart = useRef<Chart | null>(null);

  // Fetch data for reports
  const { data: stockItems = [] } = useQuery<StockItem[]>({
    queryKey: ["/api/stock-items"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: movements = [] } = useQuery<StockMovement[]>({
    queryKey: ["/api/movements"],
  });

  const { data: expiringItems = [] } = useQuery<StockItem[]>({
    queryKey: ["/api/stock-items/expiring", { days: 30 }],
  });

  // Initialize charts
  useEffect(() => {
    if (inventoryChartRef.current && stockItems.length > 0) {
      // Clean up previous chart
      if (inventoryChart.current) {
        inventoryChart.current.destroy();
      }

      // Sample data for demonstration
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
      const inventoryData = [3400, 3650, 3800, 3500, 4200, 4800, 5400];

      // Create chart
      const ctx = inventoryChartRef.current.getContext('2d');
      if (ctx) {
        inventoryChart.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: months,
            datasets: [{
              label: 'Total Inventory',
              data: inventoryData,
              borderColor: '#3B82F6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              borderWidth: 2,
              fill: true,
              tension: 0.3
            }]
          },
          options: {
            responsive: true,
            scales: {
              y: {
                beginAtZero: false
              }
            }
          }
        });
      }
    }

    if (categoryChartRef.current && categories.length > 0) {
      // Clean up previous chart
      if (categoryChart.current) {
        categoryChart.current.destroy();
      }

      // Calculate category distribution
      const categoryCounts = categories.map(category => {
        const itemsInCategory = stockItems.filter(item => item.categoryId === category.id);
        const totalQuantity = itemsInCategory.reduce((sum, item) => sum + item.quantity, 0);
        return {
          category: category.name,
          quantity: totalQuantity
        };
      });

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
      if (inventoryChart.current) {
        inventoryChart.current.destroy();
      }
      if (categoryChart.current) {
        categoryChart.current.destroy();
      }
    };
  }, [stockItems, categories, reportType]);

  const handleGenerateReport = (data: any) => {
    setIsGeneratingReport(true);
    setReportType(data.reportType);
    setDateRange(data.dateRange);
    
    // Simulate report generation
    setTimeout(() => {
      setIsGeneratingReport(false);
      toast({
        title: "Report Generated",
        description: `Your ${data.reportType} report has been generated successfully.`,
      });
    }, 1500);
  };

  // Get category distribution for the summary table
  const categorySummary = categories.map(category => {
    const itemsInCategory = stockItems.filter(item => item.categoryId === category.id);
    const totalQuantity = itemsInCategory.reduce((sum, item) => sum + item.quantity, 0);
    const expiringSoon = itemsInCategory.filter(item => 
      item.expiry && new Date(item.expiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    ).length;
    
    return {
      category,
      totalItems: itemsInCategory.length,
      quantity: totalQuantity,
      expiringSoon,
      status: totalQuantity > 500 ? 'Healthy' : totalQuantity > 200 ? 'Moderate' : 'Critical'
    };
  });

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Reports</h2>
        <Button>
          <FileDown className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        {/* Report Settings */}
        <Card className="lg:col-span-1">
          <CardHeader className="px-6 py-4 border-b border-gray-200">
            <CardTitle className="text-lg font-medium">Report Settings</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ReportForm
              onGenerate={handleGenerateReport}
              isLoading={isGeneratingReport}
            />
            
            <div className="mt-6 border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Saved Reports</h4>
              <ul className="space-y-2">
                <li>
                  <Button variant="link" className="p-0 h-auto text-primary hover:text-primary-600 flex items-center">
                    <FileText className="mr-2 h-4 w-4" />
                    Inventory Status - Jul 2023
                  </Button>
                </li>
                <li>
                  <Button variant="link" className="p-0 h-auto text-primary hover:text-primary-600 flex items-center">
                    <FileText className="mr-2 h-4 w-4" />
                    Q2 Stock Movement Report
                  </Button>
                </li>
                <li>
                  <Button variant="link" className="p-0 h-auto text-primary hover:text-primary-600 flex items-center">
                    <FileText className="mr-2 h-4 w-4" />
                    Expiring Items - Aug 2023
                  </Button>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
        
        {/* Report Display */}
        <div className="lg:col-span-3">
          {/* Inventory Status Report */}
          {reportType === 'inventory' && (
            <Card>
              <CardHeader className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <CardTitle className="text-lg font-medium">Inventory Status Report</CardTitle>
                <span className="text-sm text-gray-500">
                  {dateRange === 'week' ? 'Last 7 Days' :
                   dateRange === 'month' ? 'Last 30 Days' :
                   dateRange === 'quarter' ? 'Last 90 Days' :
                   dateRange === 'year' ? 'Last 12 Months' : 'Custom Range'}
                </span>
              </CardHeader>
              <CardContent className="p-6">
                <div className="mb-6">
                  <canvas ref={inventoryChartRef} height="200"></canvas>
                </div>
                
                <div className="mt-8">
                  <h4 className="text-md font-medium text-gray-700 mb-3">Inventory Summary by Category</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Items</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiring Soon</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {categorySummary.map((item, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{item.category.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.totalItems}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.expiringSoon}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                item.status === 'Healthy' ? 'bg-green-100 text-green-800' :
                                item.status === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {item.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="mt-8">
                  <h4 className="text-md font-medium text-gray-700 mb-3">Stock Level Insights</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Low Stock Items</h5>
                      <p className="text-3xl font-bold text-red-600">
                        {stockItems.filter(item => item.quantity < 10).length}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">Items below safety threshold</p>
                      <div className="mt-4">
                        <Button variant="link" className="p-0 h-auto text-primary">
                          View details →
                        </Button>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Movement Rate</h5>
                      <p className="text-3xl font-bold text-green-600">+12%</p>
                      <p className="text-sm text-gray-500 mt-1">Compared to last period</p>
                      <div className="mt-4">
                        <Button variant="link" className="p-0 h-auto text-primary">
                          View details →
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Stock Movement Report */}
          {reportType === 'movement' && (
            <Card>
              <CardHeader className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <CardTitle className="text-lg font-medium">Stock Movement Report</CardTitle>
                <span className="text-sm text-gray-500">
                  {dateRange === 'week' ? 'Last 7 Days' :
                   dateRange === 'month' ? 'Last 30 Days' :
                   dateRange === 'quarter' ? 'Last 90 Days' :
                   dateRange === 'year' ? 'Last 12 Months' : 'Custom Range'}
                </span>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex justify-center items-center py-10">
                  <div className="text-center">
                    <BarChart className="h-24 w-24 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-700">Movement Report</h3>
                    <p className="text-gray-500 mt-2 max-w-md">
                      Stock movement visualizations and analysis will appear here when more transfer data is available.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Expiring Items Report */}
          {reportType === 'expiry' && (
            <Card>
              <CardHeader className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <CardTitle className="text-lg font-medium">Expiring Items Report</CardTitle>
                <span className="text-sm text-gray-500">
                  {dateRange === 'week' ? 'Next 7 Days' :
                   dateRange === 'month' ? 'Next 30 Days' :
                   dateRange === 'quarter' ? 'Next 90 Days' :
                   dateRange === 'year' ? 'Next 12 Months' : 'Custom Range'}
                </span>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex justify-center items-center py-10">
                  <div className="text-center">
                    <Clock className="h-24 w-24 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-700">Expiry Report</h3>
                    <p className="text-gray-500 mt-2 max-w-md">
                      Analysis of expiring items will appear here. Currently, you have {expiringItems.length} items expiring in the next 30 days.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Medical Rep Allocation Report */}
          {reportType === 'allocation' && (
            <Card>
              <CardHeader className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <CardTitle className="text-lg font-medium">Medical Rep Allocation Report</CardTitle>
                <span className="text-sm text-gray-500">Current Allocations</span>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex justify-center items-center py-10">
                  <div className="text-center">
                    <PieChart className="h-24 w-24 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-700">Allocation Report</h3>
                    <p className="text-gray-500 mt-2 max-w-md">
                      Analysis of stock allocations to medical representatives will appear here.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
