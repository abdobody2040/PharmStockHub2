import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Filter
} from "lucide-react";
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
        <h2 className="text-2xl font-bold">Product Manager Dashboard</h2>
        <div className="flex gap-2">
          <Link href="/requests">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats for Product Managers */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Requests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {requests.filter(req => req.requestedBy === user?.id).length}
            </div>
            <p className="text-xs text-muted-foreground">Total requests submitted</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {requests.filter(req => req.requestedBy === user?.id && req.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {requests.filter(req => req.requestedBy === user?.id && req.status === 'approved').length}
            </div>
            <p className="text-xs text-muted-foreground">Completed requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stockItems.length}</div>
            <p className="text-xs text-muted-foreground">Items you can request</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {requests
              .filter(req => req.requestedBy === user?.id)
              .slice(0, 5)
              .map(request => (
                <div key={request.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{request.title}</p>
                    <p className="text-sm text-muted-foreground">{request.type}</p>
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
        </CardContent>
      </Card>
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

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6">
      <PersonalizedOnboarding />
      {user.role === 'productManager' && renderProductManagerDashboard()}
      {user.role === 'stockKeeper' && renderStockKeeperDashboard()}
      {(user.role === 'admin' || user.role === 'ceo') && renderAdminDashboard()}
      {!['productManager', 'stockKeeper', 'admin', 'ceo'].includes(user.role) && (
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