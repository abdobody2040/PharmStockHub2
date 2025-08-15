import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { 
  Package, 
  FileText, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  ArrowLeftRight,
  TrendingUp,
  Users,
  BarChart3,
  Search
} from "lucide-react";
import { StockItem, InventoryRequest, StockMovement, StockAllocation } from "@shared/schema";
import { Link } from "wouter";
import { formatDate, getExpiryStatus, getExpiryStatusColor } from "@/lib/utils";
import Chart from 'chart.js/auto';

export function ProductManagerDashboard() {
  const { user } = useAuth();
  const allocationChartRef = useRef<HTMLCanvasElement>(null);
  const allocationChart = useRef<Chart | null>(null);

  // Fetch allocated inventory (items specifically allocated to this user)
  const { data: allocatedItems = [] } = useQuery<StockItem[]>({
    queryKey: ["/api/my-allocated-inventory"],
  });

  // Fetch movements where this user is the recipient
  const { data: allMovements = [] } = useQuery<StockMovement[]>({
    queryKey: ["/api/movements"],
  });

  // Fetch all allocations to show allocation details
  const { data: allocations = [] } = useQuery<StockAllocation[]>({
    queryKey: ["/api/allocations"],
  });

  // Fetch user's requests
  const { data: requests = [] } = useQuery<InventoryRequest[]>({
    queryKey: ["/api/requests"],
  });

  // Fetch categories for proper naming
  const { data: categories = [] } = useQuery<Array<{ id: number; name: string; color: string }>>({
    queryKey: ["/api/categories"],
  });

  // Fetch users for transfers display  
  const { data: users = [] } = useQuery<Array<{ id: number; name: string; role: string }>>({
    queryKey: ["/api/users"],
  });

  // Fetch stock items for transfer details
  const { data: stockItems = [] } = useQuery<StockItem[]>({
    queryKey: ["/api/stock-items"],
  });

  // Filter movements received by this user
  const receivedMovements = allMovements.filter(movement => 
    movement.toUserId === user?.id
  );

  // Filter user's own allocations
  const userAllocations = allocations.filter(allocation => 
    allocation.userId === user?.id
  );

  // Helper function to get category name
  const getCategoryName = (categoryId: number) => {
    const category = categories.find((c: { id: number; name: string }) => c.id === categoryId);
    return category?.name || 'N/A';
  };

  // Calculate stats
  const stats = {
    totalAllocatedItems: allocatedItems.length,
    totalAllocatedQuantity: allocatedItems.reduce((sum, item) => sum + item.quantity, 0),
    lowStockAllocations: allocatedItems.filter(item => item.quantity <= 10).length,
    pendingRequests: requests.filter(req => req.requestedBy === user?.id && req.status === 'pending').length,
    approvedRequests: requests.filter(req => req.requestedBy === user?.id && req.status === 'approved').length,
    recentTransfers: receivedMovements.slice(0, 5)
  };

  // Create allocation chart
  useEffect(() => {
    if (allocationChartRef.current && allocatedItems.length > 0) {
      const ctx = allocationChartRef.current.getContext('2d');
      if (ctx) {
        // Destroy existing chart
        if (allocationChart.current) {
          allocationChart.current.destroy();
        }

        // Group items by category for the chart
        const categoryData: { [key: string]: number } = {};
        allocatedItems.forEach(item => {
          const categoryName = getCategoryName(item.categoryId);
          categoryData[categoryName] = (categoryData[categoryName] || 0) + item.quantity;
        });

        allocationChart.current = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: Object.keys(categoryData),
            datasets: [{
              data: Object.values(categoryData),
              backgroundColor: [
                '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'
              ],
              borderWidth: 2,
              borderColor: '#ffffff'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom'
              }
            }
          }
        });
      }
    }

    return () => {
      if (allocationChart.current) {
        allocationChart.current.destroy();
      }
    };
  }, [allocatedItems, categories]);

  // CSV Export function
  const exportAllocatedInventoryToCSV = () => {
    const headers = ['Item Name', 'Category', 'Allocated Quantity', 'Unit Value', 'Total Value', 'Item Number', 'Notes'];
    const csvData = allocatedItems.map(item => {
      const allocatedQty = item.quantity || 0;
      const unitPrice = (item.price || 0) / 100;
      const totalValue = allocatedQty * unitPrice;
      
      return [
        item.name,
        getCategoryName(item.categoryId),
        allocatedQty.toString(),
        `$${unitPrice.toFixed(2)}`,
        `$${totalValue.toFixed(2)}`,
        item.uniqueNumber || 'N/A',
        item.notes || 'No notes'
      ];
    });

    // Add totals row
    const totalQty = allocatedItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalValue = allocatedItems.reduce((sum, item) => {
      const allocatedQty = item.quantity || 0;
      const unitPrice = (item.price || 0) / 100;
      return sum + (allocatedQty * unitPrice);
    }, 0);
    
    csvData.push(['TOTAL', '', totalQty.toString(), '', `$${totalValue.toFixed(2)}`, '', '']);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `my-allocated-inventory-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Product Manager Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-1">Monitor your allocated promotional materials and inventory requests</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Link href="/requests">
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Button>
          </Link>
          <Link href="/inventory">
            <Button variant="outline" className="w-full sm:w-auto">
              <Package className="h-4 w-4 mr-2" />
              View Inventory
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Allocated Items</CardTitle>
            <Package className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-lg sm:text-2xl font-bold text-blue-600">
              {stats.totalAllocatedItems}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalAllocatedQuantity.toLocaleString()} total units
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600" />
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-lg sm:text-2xl font-bold text-yellow-600">
              {stats.lowStockAllocations}
            </div>
            <p className="text-xs text-muted-foreground">Need restocking</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Pending</CardTitle>
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-lg sm:text-2xl font-bold text-orange-600">
              {stats.pendingRequests}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-lg sm:text-2xl font-bold text-green-600">
              {stats.approvedRequests}
            </div>
            <p className="text-xs text-muted-foreground">Ready for pickup</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
        {/* Allocated Items List */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="h-5 w-5" />
                  My Allocated Inventory
                </CardTitle>
                <CardDescription className="mt-1">
                  Promotional materials allocated to you for distribution
                </CardDescription>
              </div>
              {allocatedItems.length > 0 && (
                <Button onClick={exportAllocatedInventoryToCSV} variant="outline" size="sm" className="w-full sm:w-auto">
                  <FileText className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {allocatedItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No items allocated to you yet</p>
                <p className="text-sm">Contact your supervisor for inventory allocation</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-2 sm:mx-0">
                <table className="w-full border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left p-2 sm:p-4 text-xs sm:text-sm font-medium text-gray-700">Item Name</th>
                      <th className="text-left p-2 sm:p-4 text-xs sm:text-sm font-medium text-gray-700">Category</th>
                      <th className="text-left p-2 sm:p-4 text-xs sm:text-sm font-medium text-gray-700">Qty</th>
                      <th className="text-left p-2 sm:p-4 text-xs sm:text-sm font-medium text-gray-700">Unit Value</th>
                      <th className="text-left p-2 sm:p-4 text-xs sm:text-sm font-medium text-gray-700">Total Value</th>
                      <th className="text-left p-2 sm:p-4 text-xs sm:text-sm font-medium text-gray-700 hidden sm:table-cell">Item #</th>
                      <th className="text-left p-2 sm:p-4 text-xs sm:text-sm font-medium text-gray-700 hidden md:table-cell">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allocatedItems.map((item) => {
                      const allocatedQty = item.quantity || 0;
                      const unitPrice = (item.price || 0) / 100;
                      const totalValue = allocatedQty * unitPrice;

                      return (
                        <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="p-2 sm:p-4">
                            <div className="font-medium text-gray-900 text-sm">{item.name}</div>
                            <div className="text-xs text-gray-500 sm:hidden">{getCategoryName(item.categoryId)}</div>
                          </td>
                          <td className="p-2 sm:p-4 hidden sm:table-cell">
                            <Badge variant="secondary" className="text-xs">
                              {getCategoryName(item.categoryId)}
                            </Badge>
                          </td>
                          <td className="p-2 sm:p-4">
                            <Badge variant="default" className="text-xs">
                              {allocatedQty.toLocaleString()}
                            </Badge>
                          </td>
                          <td className="p-2 sm:p-4 text-xs sm:text-sm text-gray-600 font-medium">
                            ${unitPrice.toFixed(2)}
                          </td>
                          <td className="p-2 sm:p-4 text-xs sm:text-sm text-gray-900 font-semibold">
                            ${totalValue.toFixed(2)}
                          </td>
                          <td className="p-2 sm:p-4 text-xs text-gray-500 hidden sm:table-cell">{item.uniqueNumber || 'N/A'}</td>
                          <td className="p-2 sm:p-4 text-xs text-gray-500 hidden md:table-cell max-w-32 truncate">{item.notes || 'No notes'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 bg-gray-50">
                      <td className="p-2 sm:p-4 font-bold text-sm">Total</td>
                      <td className="p-2 sm:p-4 hidden sm:table-cell"></td>
                      <td className="p-2 sm:p-4">
                        <Badge variant="default" className="font-bold">
                          {allocatedItems.reduce((sum, item) => sum + (item.quantity || 0), 0).toLocaleString()}
                        </Badge>
                      </td>
                      <td className="p-2 sm:p-4"></td>
                      <td className="p-2 sm:p-4 font-bold text-sm text-gray-900">
                        ${allocatedItems.reduce((sum, item) => {
                          const allocatedQty = item.quantity || 0;
                          const unitPrice = (item.price || 0) / 100;
                          return sum + (allocatedQty * unitPrice);
                        }, 0).toFixed(2)}
                      </td>
                      <td className="p-2 sm:p-4 hidden sm:table-cell"></td>
                      <td className="p-2 sm:p-4 hidden md:table-cell"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Allocation Distribution Chart */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5" />
              Distribution by Category
            </CardTitle>
            <CardDescription>
              Breakdown of your allocated inventory by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            {allocatedItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">No data to display</p>
              </div>
            ) : (
              <div className="h-64 relative">
                <canvas ref={allocationChartRef}></canvas>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transfers to Me */}
      <Card className="lg:col-span-3">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ArrowLeftRight className="h-5 w-5" />
            Recent Transfers to Me
          </CardTitle>
          <CardDescription>Latest inventory movements allocated to you</CardDescription>
        </CardHeader>
        <CardContent>
          {receivedMovements.filter(m => m.toUserId === user?.id).length > 0 ? (
            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <table className="w-full border-collapse min-w-[500px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left p-2 sm:p-4 text-xs sm:text-sm font-medium text-gray-700">Item</th>
                    <th className="text-left p-2 sm:p-4 text-xs sm:text-sm font-medium text-gray-700">Quantity</th>
                    <th className="text-left p-2 sm:p-4 text-xs sm:text-sm font-medium text-gray-700">From</th>
                    <th className="text-left p-2 sm:p-4 text-xs sm:text-sm font-medium text-gray-700">Date</th>
                    <th className="text-left p-2 sm:p-4 text-xs sm:text-sm font-medium text-gray-700 hidden md:table-cell">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {receivedMovements
                    .filter(m => m.toUserId === user?.id)
                    .slice(0, 5)
                    .map((movement) => {
                      const stockItem = stockItems.find(item => item.id === movement.stockItemId);
                      const fromUser = users.find(u => u.id === movement.fromUserId);
                      
                      return (
                        <tr key={movement.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="p-2 sm:p-4">
                            <div className="font-medium text-gray-900 text-sm">{stockItem?.name || 'Unknown Item'}</div>
                            <div className="text-xs text-gray-500 md:hidden">{movement.notes || 'No notes'}</div>
                          </td>
                          <td className="p-2 sm:p-4">
                            <Badge variant="default" className="text-xs">
                              {movement.quantity?.toLocaleString() || '0'}
                            </Badge>
                          </td>
                          <td className="p-2 sm:p-4 text-xs sm:text-sm text-gray-600">
                            {fromUser?.name || 'Central Warehouse'}
                          </td>
                          <td className="p-2 sm:p-4 text-xs sm:text-sm text-gray-600">
                            {movement.movedAt ? new Date(movement.movedAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="p-2 sm:p-4 text-xs text-gray-500 hidden md:table-cell max-w-32 truncate">
                            {movement.notes || 'No notes'}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-base font-medium text-gray-900 mb-2">No Recent Transfers</h3>
              <p className="text-sm text-gray-500">You haven't received any inventory transfers recently.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}