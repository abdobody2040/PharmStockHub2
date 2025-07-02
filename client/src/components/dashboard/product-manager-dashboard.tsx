import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  TrendingUp
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

  // Filter movements received by this user
  const receivedMovements = allMovements.filter(movement => 
    movement.toUserId === user?.id
  );

  // Filter user's own allocations
  const userAllocations = allocations.filter(allocation => 
    allocation.userId === user?.id
  );

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
          const categoryName = item.categoryId ? `Category ${item.categoryId}` : 'Uncategorized';
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
  }, [allocatedItems]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">My Inventory Dashboard</h2>
          <p className="text-muted-foreground">Track your allocated items and transfers</p>
        </div>
        <div className="flex gap-2">
          <Link href="/requests">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Button>
          </Link>
          <Link href="/inventory">
            <Button variant="outline">
              <Package className="h-4 w-4 mr-2" />
              View All Inventory
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Allocated Items</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalAllocatedItems}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalAllocatedQuantity} total units
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.lowStockAllocations}
            </div>
            <p className="text-xs text-muted-foreground">Items need restocking</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.pendingRequests}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Requests</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.approvedRequests}
            </div>
            <p className="text-xs text-muted-foreground">Ready for pickup</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Allocated Items List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              My Allocated Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            {allocatedItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No items allocated to you yet</p>
                <p className="text-sm">Contact your supervisor for inventory allocation</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allocatedItems.slice(0, 6).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.uniqueNumber ? `#${item.uniqueNumber}` : `ID: ${item.id}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-blue-600">{item.quantity}</div>
                      <div className="text-xs text-muted-foreground">units</div>
                    </div>
                  </div>
                ))}
                {allocatedItems.length > 6 && (
                  <Link href="/inventory">
                    <Button variant="ghost" className="w-full">
                      View All {allocatedItems.length} Items
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Allocation Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Allocation Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {allocatedItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No data to display</p>
              </div>
            ) : (
              <div style={{ height: '250px', position: 'relative' }}>
                <canvas ref={allocationChartRef}></canvas>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transfers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5" />
            Recent Transfers to Me
          </CardTitle>
        </CardHeader>
        <CardContent>
          {receivedMovements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ArrowLeftRight className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recent transfers</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentTransfers.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>
                      <div className="font-medium">Stock Item #{movement.stockItemId}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{movement.quantity}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {movement.fromUserId ? `U${movement.fromUserId}` : 'SYS'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">
                          {movement.fromUserId ? `User ${movement.fromUserId}` : 'System'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{formatDate(movement.movedAt)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground max-w-32 truncate">
                        {movement.notes || 'No notes'}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}