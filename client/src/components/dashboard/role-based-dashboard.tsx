import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InventoryHealthWidget } from "./inventory-health-widget";
import { PersonalizedOnboarding } from "@/components/onboarding/personalized-onboarding";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { 
  Package, 
  Users, 
  FileText, 
  BarChart3, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Plus,
  Search,
  Filter,
  ArrowRight,
  TrendingUp
} from "lucide-react";
import Chart from 'chart.js/auto';
import { useRef, useEffect } from 'react';
import { StockItem, InventoryRequest, User } from "@shared/schema";
import { Link } from "wouter";

interface DashboardStats {
  totalItems: number;
  lowStockItems: number;
  expiringItems: number;
  pendingRequests: number;
  activeUsers: number;
  recentMovements: number;
}

export function RoleBasedDashboard() {
  const { user } = useAuth();
  const allocationChartRef = useRef<HTMLCanvasElement>(null);
  const allocationChart = useRef<Chart | null>(null);

  // Use allocated inventory for role-based filtering
  const { data: allocatedInventory = [] } = useQuery<StockItem[]>({
    queryKey: ["/api/my-allocated-inventory"],
  });
  
  const { data: stockItems = [] } = useQuery<StockItem[]>({
    queryKey: ["/api/stock-items"],
  });

  const { data: requests = [] } = useQuery<InventoryRequest[]>({
    queryKey: ["/api/requests"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: expiringItems = [] } = useQuery<StockItem[]>({
    queryKey: ["/api/stock-items/expiring"],
  });

  const { data: movements = [] } = useQuery<any[]>({
    queryKey: ["/api/movements"],
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
  });

  const stats: DashboardStats = {
    totalItems: stockItems.length,
    lowStockItems: stockItems.filter(item => item.quantity <= 10).length, // Using quantity field
    expiringItems: expiringItems.length,
    pendingRequests: requests.filter(req => req.status === 'pending').length,
    activeUsers: users.filter(u => u.role !== 'admin').length,
    recentMovements: 0
  };

  const renderProductManagerDashboard = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Product Manager Dashboard</h2>
          <p className="text-muted-foreground">Monitor your allocated promotional materials and inventory requests.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/requests">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Button>
          </Link>
        </div>
      </div>

      {/* Allocated Inventory Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Allocated Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allocatedInventory.length}</div>
            <p className="text-xs text-muted-foreground">Unique items allocated to you</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allocatedInventory.reduce((sum, item) => sum + (item.quantity || 0), 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Total promotional materials</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${allocatedInventory.reduce((sum, item) => {
                const allocatedQty = item.quantity || 0;
                const unitPrice = (item.price || 0) / 100;
                return sum + (allocatedQty * unitPrice);
              }, 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Total allocated value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Requests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {requests.filter(req => req.requestedBy === user?.id).length}
            </div>
            <p className="text-xs text-muted-foreground">Total requests made</p>
          </CardContent>
        </Card>
      </div>

      {/* Allocated Items Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>My Allocated Inventory</CardTitle>
            <CardDescription>Promotional materials and samples allocated to you</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => exportAllocatedInventoryToCSV()}
            className="flex items-center gap-2"
            disabled={allocatedInventory.length === 0}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV ({allocatedInventory.length} items)
          </Button>
        </CardHeader>
        <CardContent>
          {allocatedInventory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">Item Name</th>
                    <th className="text-left p-4">Category</th>
                    <th className="text-left p-4">Allocated Quantity</th>
                    <th className="text-left p-4">Unit Value</th>
                    <th className="text-left p-4">Total Value</th>
                    <th className="text-left p-4">Item Number</th>
                    <th className="text-left p-4">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {allocatedInventory.map((item) => {
                    const allocatedQty = item.quantity || 0; // quantity field contains allocated amount
                    const unitPrice = (item.price || 0) / 100; // Convert from cents
                    const totalValue = allocatedQty * unitPrice;
                    
                    return (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="p-4 font-medium">{item.name}</td>
                        <td className="p-4">
                          <Badge variant="secondary">{getCategoryName(item.categoryId)}</Badge>
                        </td>
                        <td className="p-4">
                          <Badge variant={allocatedQty > 0 ? "default" : "destructive"}>
                            {allocatedQty.toLocaleString()}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm text-gray-600">
                          ${unitPrice.toFixed(2)}
                        </td>
                        <td className="p-4 text-sm font-medium">
                          ${totalValue.toFixed(2)}
                        </td>
                        <td className="p-4 text-sm text-gray-600">{item.uniqueNumber || 'N/A'}</td>
                        <td className="p-4 text-sm text-gray-600">{item.notes || 'No notes'}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 bg-gray-50">
                    <td className="p-4 font-bold">Total</td>
                    <td className="p-4"></td>
                    <td className="p-4">
                      <Badge variant="default">
                        {allocatedInventory.reduce((sum, item) => sum + (item.quantity || 0), 0).toLocaleString()}
                      </Badge>
                    </td>
                    <td className="p-4"></td>
                    <td className="p-4 font-bold">
                      ${allocatedInventory.reduce((sum, item) => {
                        const allocatedQty = item.quantity || 0;
                        const unitPrice = (item.price || 0) / 100;
                        return sum + (allocatedQty * unitPrice);
                      }, 0).toFixed(2)}
                    </td>
                    <td className="p-4"></td>
                    <td className="p-4"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Allocated Items</h3>
              <p className="text-gray-500">You don't have any items allocated to you yet. Contact your supervisor for inventory allocation.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Transfers to Me */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5" />
            Recent Transfers to Me
          </CardTitle>
          <CardDescription>Latest inventory movements allocated to you</CardDescription>
        </CardHeader>
        <CardContent>
          {movements && (movements as any[]).filter((m: any) => m.toUserId === user?.id).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">Item</th>
                    <th className="text-left p-4">Quantity</th>
                    <th className="text-left p-4">From</th>
                    <th className="text-left p-4">Date</th>
                    <th className="text-left p-4">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {(movements as any[])
                    .filter((m: any) => m.toUserId === user?.id)
                    .slice(0, 5)
                    .map((movement: any) => {
                      const stockItem = stockItems.find(item => item.id === movement.stockItemId);
                      const fromUser = users.find(u => u.id === movement.fromUserId);
                      
                      return (
                        <tr key={movement.id} className="border-b hover:bg-gray-50">
                          <td className="p-4 font-medium">
                            {stockItem?.name || `Stock Item #${movement.stockItemId}`}
                          </td>
                          <td className="p-4">
                            <Badge variant="default">
                              {movement.quantity?.toLocaleString() || '0'}
                            </Badge>
                          </td>
                          <td className="p-4 text-sm text-gray-600">
                            {fromUser?.name || 'Central Warehouse'}
                          </td>
                          <td className="p-4 text-sm text-gray-600">
                            {movement.movedAt ? new Date(movement.movedAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="p-4 text-sm text-gray-600">
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Recent Transfers</h3>
              <p className="text-gray-500">You haven't received any inventory transfers recently.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request Management and Chart Section */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Recent Requests</CardTitle>
            <CardDescription>Your latest inventory requests</CardDescription>
          </CardHeader>
          <CardContent>
            {requests.filter(req => req.requestedBy === user?.id).length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Requests Yet</h3>
                <p className="text-gray-500 mb-4">You haven't made any inventory requests.</p>
                <Link href="/requests">
                  <Button>Create Your First Request</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {requests
                  .filter(req => req.requestedBy === user?.id)
                  .slice(0, 5)
                  .map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{request.type.replace('_', ' ').toUpperCase()}</p>
                        <p className="text-sm text-gray-500">
                          {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <Badge variant={
                        request.status === 'approved' ? 'default' :
                        request.status === 'pending' ? 'secondary' : 'destructive'
                      }>
                        {request.status}
                      </Badge>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/requests" className="block">
              <Button className="w-full justify-start">
                <Plus className="h-4 w-4 mr-2" />
                New Inventory Request
              </Button>
            </Link>
            <Link href="/inventory" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Search className="h-4 w-4 mr-2" />
                Browse Inventory
              </Button>
            </Link>
            <Link href="/reports" className="block">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                View Reports
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Allocation Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Allocation Distribution
            </CardTitle>
            <CardDescription>Distribution by category type</CardDescription>
          </CardHeader>
          <CardContent>
            {allocatedInventory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No allocation data to display</p>
              </div>
            ) : (
              <div style={{ height: '200px', position: 'relative' }}>
                <canvas ref={allocationChartRef}></canvas>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderStockKeeperDashboard = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Stock Keeper Dashboard</h2>
        <div className="flex gap-2">
          <Link href="/inventory">
            <Button variant="outline">
              <Search className="h-4 w-4 mr-2" />
              Search Inventory
            </Button>
          </Link>
          <Link href="/inventory">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </Link>
        </div>
      </div>

      {/* Inventory Health Widget */}
      <InventoryHealthWidget />

      {/* Action Items */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Pending Approvals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {requests
                .filter(req => req.status === 'pending' && req.assignedTo === user?.id)
                .slice(0, 5)
                .map(request => (
                  <div key={request.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">{request.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {request.type} - Requested by {users.find(u => u.id === request.requestedBy)?.name}
                      </p>
                    </div>
                    <Link href="/requests">
                      <Button size="sm">Review</Button>
                    </Link>
                  </div>
                ))}
              {requests.filter(req => req.status === 'pending' && req.assignedTo === user?.id).length === 0 && (
                <p className="text-muted-foreground">No pending requests</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Urgent Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.lowStockItems > 0 && (
                <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                  <span className="text-sm">{stats.lowStockItems} items need restocking</span>
                  <Link href="/inventory">
                    <Button size="sm" variant="outline">View</Button>
                  </Link>
                </div>
              )}
              {stats.expiringItems > 0 && (
                <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                  <span className="text-sm">{stats.expiringItems} items expiring soon</span>
                  <Link href="/inventory">
                    <Button size="sm" variant="outline">View</Button>
                  </Link>
                </div>
              )}
              {stats.lowStockItems === 0 && stats.expiringItems === 0 && (
                <p className="text-muted-foreground">No urgent actions required</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderAdminDashboard = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Admin Dashboard</h2>
        <div className="flex gap-2">
          <Link href="/reports">
            <Button variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              Reports
            </Button>
          </Link>
          <Link href="/users">
            <Button>
              <Users className="h-4 w-4 mr-2" />
              Manage Users
            </Button>
          </Link>
        </div>
      </div>

      {/* Overall System Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">Active users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requests.length}</div>
            <p className="text-xs text-muted-foreground">All time requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItems}</div>
            <p className="text-xs text-muted-foreground">Total items managed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">98%</div>
            <p className="text-xs text-muted-foreground">Overall system status</p>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Health for Admins */}
      <InventoryHealthWidget />
    </div>
  );

  // Helper function to get category name
  const getCategoryName = (categoryId: number) => {
    const category = (categories as any[]).find((c: any) => c.id === categoryId);
    return category?.name || 'N/A';
  }

  // Create allocation distribution chart for Product Manager
  useEffect(() => {
    if (allocationChartRef.current && allocatedInventory.length > 0 && user?.role === 'productManager') {
      const ctx = allocationChartRef.current.getContext('2d');
      if (ctx) {
        // Destroy existing chart
        if (allocationChart.current) {
          allocationChart.current.destroy();
        }

        // Group items by category for the chart
        const categoryData: { [key: string]: number } = {};
        allocatedInventory.forEach(item => {
          const categoryName = getCategoryName(item.categoryId);
          categoryData[categoryName] = (categoryData[categoryName] || 0) + (item.quantity || 0);
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
  }, [allocatedInventory, categories, user?.role]);

  // CSV Export function for marketer
  const exportAllocatedInventoryToCSV = () => {
    const headers = ['Item Name', 'Category', 'Allocated Quantity', 'Unit Value', 'Total Value', 'Item Number', 'Notes'];
    const csvData = allocatedInventory.map(item => {
      const allocatedQty = item.quantity || 0; // quantity field contains allocated amount
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
    const totalQty = allocatedInventory.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalValue = allocatedInventory.reduce((sum, item) => {
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

  const renderMarketerDashboard = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Marketer Dashboard</h1>
        <p className="text-muted-foreground">Monitor your allocated promotional materials and inventory status.</p>
      </div>

      {/* Allocated Inventory Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Allocated Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allocatedInventory.length}</div>
            <p className="text-xs text-muted-foreground">Unique items allocated to you</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allocatedInventory.reduce((sum, item) => sum + (item.quantity || 0), 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Total promotional materials</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${allocatedInventory.reduce((sum, item) => {
                const allocatedQty = item.quantity || 0;
                const unitPrice = (item.price || 0) / 100;
                return sum + (allocatedQty * unitPrice);
              }, 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Total allocated value</p>
          </CardContent>
        </Card>
      </div>

      {/* Allocated Items Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>My Allocated Inventory</CardTitle>
            <CardDescription>Promotional materials and samples allocated to you</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => exportAllocatedInventoryToCSV()}
            className="flex items-center gap-2"
            disabled={allocatedInventory.length === 0}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV ({allocatedInventory.length} items)
          </Button>
        </CardHeader>
        <CardContent>
          {allocatedInventory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">Item Name</th>
                    <th className="text-left p-4">Category</th>
                    <th className="text-left p-4">Allocated Quantity</th>
                    <th className="text-left p-4">Unit Value</th>
                    <th className="text-left p-4">Total Value</th>
                    <th className="text-left p-4">Item Number</th>
                    <th className="text-left p-4">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {allocatedInventory.map((item) => {
                    const allocatedQty = item.quantity || 0; // quantity field contains allocated amount
                    const unitPrice = (item.price || 0) / 100; // Convert from cents
                    const totalValue = allocatedQty * unitPrice;
                    
                    return (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="p-4 font-medium">{item.name}</td>
                        <td className="p-4">
                          <Badge variant="secondary">{getCategoryName(item.categoryId)}</Badge>
                        </td>
                        <td className="p-4">
                          <Badge variant={allocatedQty > 0 ? "default" : "destructive"}>
                            {allocatedQty.toLocaleString()}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm text-gray-600">
                          ${unitPrice.toFixed(2)}
                        </td>
                        <td className="p-4 text-sm font-medium">
                          ${totalValue.toFixed(2)}
                        </td>
                        <td className="p-4 text-sm text-gray-600">{item.uniqueNumber || 'N/A'}</td>
                        <td className="p-4 text-sm text-gray-600">{item.notes || 'No notes'}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 bg-gray-50">
                    <td className="p-4 font-bold">Total</td>
                    <td className="p-4"></td>
                    <td className="p-4">
                      <Badge variant="default">
                        {allocatedInventory.reduce((sum, item) => sum + (item.quantity || 0), 0).toLocaleString()}
                      </Badge>
                    </td>
                    <td className="p-4"></td>
                    <td className="p-4 font-bold">
                      ${allocatedInventory.reduce((sum, item) => {
                        const allocatedQty = item.quantity || 0;
                        const unitPrice = (item.price || 0) / 100;
                        return sum + (allocatedQty * unitPrice);
                      }, 0).toFixed(2)}
                    </td>
                    <td className="p-4"></td>
                    <td className="p-4"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Allocated Items</h3>
              <p className="text-gray-500">You don't have any promotional materials allocated to you yet.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Transfers to Me */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transfers to Me</CardTitle>
          <CardDescription>Latest inventory movements allocated to you</CardDescription>
        </CardHeader>
        <CardContent>
          {movements.filter(m => m.toUserId === user?.id).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">Item</th>
                    <th className="text-left p-4">Quantity</th>
                    <th className="text-left p-4">From</th>
                    <th className="text-left p-4">Date</th>
                    <th className="text-left p-4">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {movements
                    .filter(m => m.toUserId === user?.id)
                    .slice(0, 5)
                    .map((movement) => {
                      const stockItem = stockItems.find(item => item.id === movement.stockItemId);
                      const fromUser = users.find(u => u.id === movement.fromUserId);
                      
                      return (
                        <tr key={movement.id} className="border-b hover:bg-gray-50">
                          <td className="p-4 font-medium">{stockItem?.name || 'Unknown Item'}</td>
                          <td className="p-4">
                            <Badge variant="default">
                              {movement.quantity?.toLocaleString() || '0'}
                            </Badge>
                          </td>
                          <td className="p-4 text-sm text-gray-600">
                            {fromUser?.name || 'Central Warehouse'}
                          </td>
                          <td className="p-4 text-sm text-gray-600">
                            {movement.movedAt ? new Date(movement.movedAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="p-4 text-sm text-gray-600">
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Recent Transfers</h3>
              <p className="text-gray-500">You haven't received any inventory transfers recently.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6">
      <PersonalizedOnboarding />

      {user.role === 'productManager' && renderProductManagerDashboard()}
      {user.role === 'stockKeeper' && renderStockKeeperDashboard()}
      {user.role === 'marketer' && renderMarketerDashboard()}
      {(user.role === 'admin' || user.role === 'ceo') && renderAdminDashboard()}
      {!['productManager', 'stockKeeper', 'admin', 'ceo', 'marketer'].includes(user.role) && (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Welcome to the Inventory System</h2>
          <p className="text-muted-foreground">
            Your dashboard will be customized based on your role permissions.
          </p>
        </div>
      )}
    </div>
  );
}