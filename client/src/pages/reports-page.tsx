import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { ReportForm } from "@/components/reports/report-form";
import { ReportShare } from "@/components/reports/report-share";
import { 
  FileDown, 
  FileText,
  BarChart4,
  BarChart, 
  PieChart,
  Clock,
  Share2
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
  Category,
  User
} from "@shared/schema";
import Chart from 'chart.js/auto';
import { jsPDF } from "jspdf";
import { useEffect, useRef } from "react";

export default function ReportsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportType, setReportType] = useState("inventory");
  const [dateRange, setDateRange] = useState("month");
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [currentReportData, setCurrentReportData] = useState<any[][]>([]);
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
  
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Initialize charts
  useEffect(() => {
    if (inventoryChartRef.current && stockItems.length > 0) {
      // Clean up previous chart
      if (inventoryChart.current) {
        inventoryChart.current.destroy();
      }

      // Group stock items by category
      const categoryTotals = categories.reduce((acc, category) => {
        const itemsInCategory = stockItems.filter(item => item.categoryId === category.id);
        const total = itemsInCategory.reduce((sum, item) => sum + item.quantity, 0);
        acc[category.name] = total;
        return acc;
      }, {} as Record<string, number>);

      // Create chart
      const ctx = inventoryChartRef.current.getContext('2d');
      if (ctx) {
        inventoryChart.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: Object.keys(categoryTotals),
            datasets: [{
              label: 'Total Inventory by Category',
              data: Object.values(categoryTotals),
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

  const handleGenerateReport = (data: FormData) => {
    setIsGeneratingReport(true);
    const reportType = data.get('reportType') as string;
    const dateRange = data.get('dateRange') as string;
    const exportFormat = data.get('exportFormat') as string || 'pdf';
    
    setReportType(reportType);
    setDateRange(dateRange);
    
    // Prepare report data based on report type
    let reportData: any[][] = [];
    
    switch(reportType) {
      case 'inventory':
        reportData = [
          ["ID", "Name", "Category", "Quantity", "Unit Price ($)", "Total Value ($)", "Expiry Date", "Status"],
          ...stockItems.map(item => {
            const category = categories.find(c => c.id === item.categoryId)?.name || 'Unknown';
            const status = item.quantity < 10 ? 'Low Stock' : 'Active';
            const expiryDate = item.expiry ? new Date(item.expiry).toISOString().split('T')[0] : 'N/A';
            const unitPrice = item.price ? (item.price / 100).toFixed(2) : '0.00';
            const totalValue = item.price ? ((item.price * item.quantity) / 100).toFixed(2) : '0.00';
            
            return [
              item.id.toString(),
              item.name,
              category,
              item.quantity.toString(),
              unitPrice,
              totalValue,
              expiryDate,
              status
            ];
          })
        ];
        break;
        
      case 'movement':
        reportData = [
          ["ID", "Item", "From User", "To User", "Quantity", "Unit Price ($)", "Total Value ($)", "Date", "Status"],
          ...movements.map(movement => {
            const stockItem = stockItems.find(i => i.id === movement.stockItemId);
            const item = stockItem?.name || 'Unknown';
            const fromUser = movement.fromUserId ? 
              (users.find(u => u.id === movement.fromUserId)?.name || 'Unknown') : 'Warehouse';
            const toUser = movement.toUserId ? 
              (users.find(u => u.id === movement.toUserId)?.name || 'Unknown') : 'Warehouse';
            const unitPrice = stockItem?.price ? (stockItem.price / 100).toFixed(2) : '0.00';
            const totalValue = stockItem?.price ? ((stockItem.price * movement.quantity) / 100).toFixed(2) : '0.00';
            const moveDate = movement.movedAt ? new Date(movement.movedAt).toISOString().split('T')[0] : 'N/A';
            
            // Calculate status based on time since movement
            let status = 'Completed';
            if (movement.movedAt) {
              const daysSinceMove = Math.floor((Date.now() - new Date(movement.movedAt).getTime()) / (1000 * 60 * 60 * 24));
              if (daysSinceMove < 1) status = 'Recent';
              else if (daysSinceMove < 7) status = 'Last Week';
              else if (daysSinceMove < 30) status = 'Last Month';
              else status = 'Archive';
            }
            
            return [
              movement.id.toString(),
              item,
              fromUser,
              toUser,
              movement.quantity.toString(),
              unitPrice,
              totalValue,
              moveDate,
              status
            ];
          })
        ];
        break;
        
      case 'expiry':
        reportData = [
          ["ID", "Name", "Category", "Quantity", "Unit Price ($)", "Total Value ($)", "Expiry Date", "Days Remaining", "Risk Level"],
          ...expiringItems.map(item => {
            const category = categories.find(c => c.id === item.categoryId)?.name || 'Unknown';
            const expiryDate = item.expiry ? new Date(item.expiry).toISOString().split('T')[0] : 'N/A';
            const daysRemaining = item.expiry ? 
              Math.ceil((new Date(item.expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 'N/A';
            const unitPrice = item.price ? (item.price / 100).toFixed(2) : '0.00';
            const totalValue = item.price ? ((item.price * item.quantity) / 100).toFixed(2) : '0.00';
            
            // Determine risk level
            let riskLevel = 'Low';
            if (typeof daysRemaining === 'number') {
              if (daysRemaining <= 0) riskLevel = 'Expired';
              else if (daysRemaining <= 14) riskLevel = 'Critical';
              else if (daysRemaining <= 30) riskLevel = 'High';
              else if (daysRemaining <= 60) riskLevel = 'Medium';
            }
            
            return [
              item.id.toString(),
              item.name,
              category,
              item.quantity.toString(),
              unitPrice,
              totalValue,
              expiryDate,
              typeof daysRemaining === 'number' ? daysRemaining.toString() : daysRemaining,
              riskLevel
            ];
          })
        ];
        break;
        
      case 'allocation':
        // This would be filled with allocation data if we had it in the app
        reportData = [
          ["ID", "Medical Rep", "Item", "Allocated Quantity", "Date Allocated"],
          // Would be populated with actual allocation data
        ];
        break;
        
      default:
        reportData = [["No data available for this report type"]];
    }
    
    // Store the current report data for sharing
    setCurrentReportData(reportData);
    
    // Generate the report in the requested format
    setTimeout(() => {
      if (exportFormat === 'pdf') {
        generatePdfReport(reportType, reportData);
      } else if (exportFormat === 'excel') {
        generateExcelReport(reportType, reportData);
      } else if (exportFormat === 'csv') {
        generateCsvReport(reportType, reportData);
      }
      
      setIsGeneratingReport(false);
      toast({
        title: "Report Generated",
        description: `Your ${reportType} report has been generated and downloaded successfully.`,
      });
    }, 1000);
  };
  
  // Generate PDF report
  const generatePdfReport = (reportType: string, data: any[][]) => {
    const doc = new jsPDF();
    const reportTitle = reportType.charAt(0).toUpperCase() + reportType.slice(1) + ' Report';
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;
    
    // Add report title
    doc.setFontSize(20);
    doc.text(reportTitle, pageWidth / 2, y, { align: 'center' });
    y += 10;
    
    // Add date
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, y, { align: 'center' });
    y += 15;
    
    // Add table
    if (data.length > 1) {
      doc.setFontSize(10);
      
      // Table headers
      const headers = data[0];
      const columnWidths = headers.map(header => 
        Math.min(30, Math.max(15, (header.length * 2.5)))
      );
      
      // Calculate total width
      const totalWidth = columnWidths.reduce((sum, width) => sum + width, 0);
      const startX = (pageWidth - totalWidth) / 2;
      
      // Draw header row
      let x = startX;
      doc.setFillColor(240, 240, 240);
      doc.rect(startX, y, totalWidth, 10, 'F');
      
      doc.setFont('helvetica', 'bold');
      headers.forEach((header, i) => {
        doc.text(header, x + 2, y + 7);
        x += columnWidths[i];
      });
      y += 10;
      
      // Draw data rows
      doc.setFont('helvetica', 'normal');
      for (let i = 1; i < Math.min(data.length, 25); i++) {
        x = startX;
        const row = data[i];
        
        row.forEach((cell, j) => {
          doc.text(String(cell).substring(0, 30), x + 2, y + 7);
          x += columnWidths[j];
        });
        
        y += 10;
        
        // Add a new page if we're near the bottom
        if (y > 280 && i < data.length - 1) {
          doc.addPage();
          y = 20;
        }
      }
    } else {
      doc.text("No data available for this report", 14, y);
    }
    
    // Save the PDF
    doc.save(`${reportType}-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };
  
  // Generate Excel report (as TSV for simplicity)
  const generateExcelReport = (reportType: string, data: any[][]) => {
    // Create a tsv string that Excel can open
    const tsvContent = data.map(row => row.join("\t")).join("\n");
    
    // Create download link
    const encodedUri = "data:text/tab-separated-values;charset=utf-8," + encodeURIComponent(tsvContent);
    const downloadLink = document.createElement("a");
    downloadLink.href = encodedUri;
    downloadLink.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.tsv`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };
  
  // Generate CSV report
  const generateCsvReport = (reportType: string, data: any[][]) => {
    // Create a CSV string
    const csvContent = data.map(row => 
      row.map(cell => {
        // Escape quotes and wrap in quotes if needed
        const cellStr = String(cell);
        return /[",\n]/.test(cellStr) ? 
          `"${cellStr.replace(/"/g, '""')}"` : 
          cellStr;
      }).join(",")
    ).join("\n");
    
    // Create download link
    const encodedUri = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
    const downloadLink = document.createElement("a");
    downloadLink.href = encodedUri;
    downloadLink.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
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

  // Handle opening the share dialog
  const handleShareReport = () => {
    if (currentReportData.length === 0) {
      toast({
        title: "No report to share",
        description: "Please generate a report first before sharing.",
        variant: "destructive",
      });
      return;
    }
    setIsShareDialogOpen(true);
  };

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Reports</h2>
        <div className="flex space-x-2">
          <Button 
            onClick={handleShareReport}
            variant="outline"
            className="flex items-center"
            disabled={currentReportData.length === 0}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share Report
          </Button>
        </div>
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
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Until Expiry</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {expiringItems.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                            No items expiring in the next 30 days
                          </td>
                        </tr>
                      ) : (
                        expiringItems.map(item => {
                          const category = categories.find(c => c.id === item.categoryId);
                          const daysUntilExpiry = item.expiry ? 
                            Math.ceil((new Date(item.expiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 
                            null;
                          
                          let status = 'Safe';
                          let statusColor = 'bg-green-100 text-green-800';
                          
                          if (daysUntilExpiry !== null) {
                            if (daysUntilExpiry <= 0) {
                              status = 'Expired';
                              statusColor = 'bg-red-100 text-red-800';
                            } else if (daysUntilExpiry <= 14) {
                              status = 'Critical';
                              statusColor = 'bg-red-100 text-red-800';
                            } else if (daysUntilExpiry <= 30) {
                              status = 'Warning';
                              statusColor = 'bg-yellow-100 text-yellow-800';
                            }
                          }

                          return (
                            <tr key={item.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {item.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {category?.name || 'Unknown'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {daysUntilExpiry !== null ? 
                                  daysUntilExpiry <= 0 ? 
                                    'Expired' : 
                                    `${daysUntilExpiry} days` : 
                                  'No expiry date'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {item.quantity}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}`}>
                                  {status}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
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
      
      {/* Report Share Dialog */}
      <ReportShare
        isOpen={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        reportType={reportType}
        reportData={currentReportData}
      />
    </MainLayout>
  );
}
