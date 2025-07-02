import { useState, useEffect } from "react";
import { Switch, Route, Link, useLocation } from "wouter";
import { 
  Home, 
  Package, 
  FileText, 
  Settings, 
  BarChart3, 
  RefreshCw,
  User,
  ChevronLeft,
  QrCode,
  Scan,
  List,
  Search,
  Plus
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { StockItem, Category } from "@shared/schema";
import { getExpiryStatus, getExpiryStatusColor, truncateText } from "@/lib/utils";
import { MobileScanner } from "@/components/barcode/mobile-scanner";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { SelectSeparator } from "@/components/ui/select";

// Mobile Dashboard component
function MobileDashboard() {
  const { user } = useAuth();
  const userName = user?.name || "User";
  const { data: stockItems = [] } = useQuery<StockItem[]>({
    queryKey: ["/api/my-allocated-inventory"],
  });
  
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });
  
  const lowStockItems = stockItems.filter(item => item.quantity < 10);
  const expiringItems = stockItems.filter(item => 
    item.expiry && getExpiryStatus(item.expiry) !== 'safe'
  );
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const refreshData = () => {
    setIsRefreshing(true);
    // Simulate refreshing data
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };
  
  // Calculate inventory summary
  const totalItems = stockItems.length;
  const totalQuantity = stockItems.reduce((sum, item) => sum + item.quantity, 0);
  
  return (
    <div className="space-y-4 pb-16">
      {/* Header with refresh button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Welcome back</h2>
          <p className="text-sm text-gray-500">{userName}</p>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={refreshData}
          disabled={isRefreshing}
          className={isRefreshing ? "animate-spin" : ""}
        >
          <RefreshCw className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-3 flex flex-col items-center justify-center text-center">
            <p className="text-xs text-gray-500 mb-1">Total Items</p>
            <h3 className="text-2xl font-bold">{totalItems}</h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex flex-col items-center justify-center text-center">
            <p className="text-xs text-gray-500 mb-1">Total Quantity</p>
            <h3 className="text-2xl font-bold">{totalQuantity}</h3>
          </CardContent>
        </Card>
      </div>
      
      {/* Alert cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700">Important Alerts</h3>
        
        {/* Low stock alert */}
        <Link href="/mobile/inventory?filter=low">
          <a className="block">
            <Card className={lowStockItems.length > 0 ? "border-orange-300 bg-orange-50" : ""}>
              <CardContent className="p-3 flex justify-between items-center">
                <div>
                  <h4 className="font-medium">Low Stock Items</h4>
                  <p className="text-sm text-gray-500">{lowStockItems.length} items below threshold</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ChevronLeft className="h-4 w-4 rotate-180" />
                </Button>
              </CardContent>
            </Card>
          </a>
        </Link>
        
        {/* Expiring items alert */}
        <Link href="/mobile/inventory?filter=expiring">
          <a className="block">
            <Card className={expiringItems.length > 0 ? "border-red-300 bg-red-50" : ""}>
              <CardContent className="p-3 flex justify-between items-center">
                <div>
                  <h4 className="font-medium">Expiring Items</h4>
                  <p className="text-sm text-gray-500">{expiringItems.length} items expiring soon</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ChevronLeft className="h-4 w-4 rotate-180" />
                </Button>
              </CardContent>
            </Card>
          </a>
        </Link>
      </div>
      
      {/* Quick actions */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700">Quick Actions</h3>
        
        <div className="grid grid-cols-2 gap-3">
          <Link href="/mobile/scan">
            <a className="block">
              <Card>
                <CardContent className="p-3 flex flex-col items-center text-center py-4">
                  <Scan className="h-6 w-6 mb-2 text-primary" />
                  <h4 className="font-medium">Scan Barcode</h4>
                </CardContent>
              </Card>
            </a>
          </Link>
          
          <Link href="/mobile/inventory/add">
            <a className="block">
              <Card>
                <CardContent className="p-3 flex flex-col items-center text-center py-4">
                  <Plus className="h-6 w-6 mb-2 text-primary" />
                  <h4 className="font-medium">Add Item</h4>
                </CardContent>
              </Card>
            </a>
          </Link>
        </div>
      </div>
      
      {/* Categories summary */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700">Categories</h3>
        <div className="space-y-2">
          {categories.slice(0, 4).map((category) => {
            const itemsInCategory = stockItems.filter(item => item.categoryId === category.id);
            const totalItems = itemsInCategory.length;
            const percentage = Math.min(100, Math.round((totalItems / (stockItems.length || 1)) * 100));
            
            return (
              <div key={category.id} className="space-y-1">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">{category.name}</p>
                  <p className="text-xs text-gray-500">{totalItems} items</p>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            );
          })}
        </div>
        
        {categories.length > 4 && (
          <div className="text-center">
            <Link href="/mobile/inventory">
              <a className="text-sm text-primary font-medium">
                View All Categories
              </a>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// Mobile Inventory component
function MobileInventory() {
  const [location, setLocation] = useLocation();
  const params = new URLSearchParams(location.split('?')[1]);
  const filter = params.get('filter');
  
  const { data: stockItems = [] } = useQuery<StockItem[]>({
    queryKey: ["/api/my-specialty-inventory"],
  });
  
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });
  
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter items based on filter parameter and search query
  const filteredItems = stockItems.filter(item => {
    if (filter === 'low' && item.quantity >= 10) {
      return false;
    }
    
    if (filter === 'expiring' && (!item.expiry || getExpiryStatus(item.expiry) === 'safe')) {
      return false;
    }
    
    if (searchQuery) {
      return item.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    
    return true;
  });
  
  const filterTitle = filter === 'low' ? 'Low Stock Items' : 
                      filter === 'expiring' ? 'Expiring Items' : 'All Inventory';
  
  return (
    <div className="space-y-4 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{filterTitle}</h2>
        <Link href="/mobile/inventory/add">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Item
          </Button>
        </Link>
      </div>
      
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <Input 
          placeholder="Search inventory..." 
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      {/* Item list */}
      <ScrollArea className="h-[calc(100vh-220px)]">
        <div className="space-y-3">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => {
              const category = categories.find(c => c.id === item.categoryId);
              const expiryStatus = item.expiry ? getExpiryStatus(item.expiry) : 'unknown';
              
              return (
                <Link key={item.id} href={`/mobile/inventory/${item.id}`}>
                  <a className="block">
                    <Card>
                      <CardContent className="p-3">
                        <div className="flex justify-between">
                          <div>
                            <h3 className="font-medium">{item.name}</h3>
                            <div className="flex items-center mt-1 space-x-2">
                              {category && (
                                <Badge variant="outline" className="text-xs py-0 h-5">
                                  {category.name}
                                </Badge>
                              )}
                              <p className="text-xs text-gray-500">
                                Qty: <span className={item.quantity < 10 ? "text-red-500 font-medium" : ""}>
                                  {item.quantity}
                                </span>
                              </p>
                            </div>
                          </div>
                          
                          {item.expiry && expiryStatus !== 'unknown' && (
                            <div className={`px-2 py-1 rounded-md text-xs ${getExpiryStatusColor(expiryStatus)}`}>
                              {expiryStatus === 'expired' ? 'Expired' : 
                               expiryStatus === 'critical' ? 'Critical' : 
                               expiryStatus === 'warning' ? 'Warning' : 'Good'}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </a>
                </Link>
              );
            })
          ) : (
            <div className="text-center py-10">
              <Package className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No items found</p>
              {searchQuery && (
                <Button variant="link" onClick={() => setSearchQuery("")}>
                  Clear search
                </Button>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// Mobile Scanner component
function MobileScannerPage() {
  const { toast } = useToast();
  
  const handleScan = (data: string) => {
    if (data) {
      toast({
        title: "Barcode Detected",
        description: `Detected: ${data}`,
      });
    }
  };
  
  return (
    <div className="space-y-4 pb-16">
      <h2 className="text-xl font-bold">Scan Barcode</h2>
      <Card>
        <CardContent className="p-4">
          <MobileScanner onScan={handleScan} />
        </CardContent>
      </Card>
      <p className="text-sm text-gray-500 text-center">
        Position barcode within the frame to scan
      </p>
    </div>
  );
}

// Mobile Reports component
function MobileReports() {
  const reportTypes = [
    { title: "Inventory Status", icon: <Package className="h-5 w-5 mr-3 text-primary" /> },
    { title: "Stock Movement", icon: <RefreshCw className="h-5 w-5 mr-3 text-primary" /> },
    { title: "Expiry Report", icon: <FileText className="h-5 w-5 mr-3 text-primary" /> },
    { title: "Usage Analytics", icon: <BarChart3 className="h-5 w-5 mr-3 text-primary" /> }
  ];
  
  return (
    <div className="space-y-4 pb-16">
      <h2 className="text-xl font-bold">Reports</h2>
      <div className="space-y-3">
        {reportTypes.map((report, index) => (
          <Card key={index}>
            <CardContent className="p-3 flex items-center justify-between">
              <div className="flex items-center">
                {report.icon}
                <span>{report.title}</span>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ChevronLeft className="h-4 w-4 rotate-180" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Mobile Profile/Settings component
function MobileProfile() {
  const { user, logoutMutation } = useAuth();
  const userName = user?.name || "User";
  const userRole = user?.role || "user";
  
  const settingsItems = [
    { title: "Account Settings", icon: <User className="h-5 w-5 mr-3 text-gray-500" /> },
    { title: "Notifications", icon: <FileText className="h-5 w-5 mr-3 text-gray-500" /> },
    { title: "App Settings", icon: <Settings className="h-5 w-5 mr-3 text-gray-500" /> }
  ];
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  return (
    <div className="space-y-4 pb-16">
      <div className="flex flex-col items-center justify-center py-6">
        <Avatar className="h-20 w-20 mb-4">
          <AvatarImage src="" />
          <AvatarFallback className="text-lg">{userName.charAt(0)}</AvatarFallback>
        </Avatar>
        <h2 className="text-xl font-bold">{userName}</h2>
        <p className="text-sm text-gray-500">{userRole}</p>
      </div>
      
      <div className="space-y-3">
        {settingsItems.map((item, index) => (
          <div key={index}>
            <Button variant="ghost" className="w-full justify-start">
              {item.icon}
              {item.title}
            </Button>
          </div>
        ))}
        
        <SelectSeparator />
        
        <Button 
          variant="destructive" 
          className="w-full"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
        >
          {logoutMutation.isPending ? "Logging out..." : "Log Out"}
        </Button>
      </div>
    </div>
  );
}

export default function MobileApp() {
  const [location] = useLocation();
  
  // Detect if actually on a mobile device
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);
  
  const isActive = (path: string) => {
    if (path === "/mobile" && location === "/mobile") {
      return true;
    }
    return path !== "/mobile" && location.startsWith(path);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Mobile app container */}
      <div className="flex-1 container max-w-md mx-auto bg-white min-h-screen shadow-sm p-4">
        {/* Content area */}
        <main>
          <Switch>
            <Route path="/mobile" component={MobileDashboard} />
            <Route path="/mobile/inventory" component={MobileInventory} />
            <Route path="/mobile/scan" component={MobileScannerPage} />
            <Route path="/mobile/reports" component={MobileReports} />
            <Route path="/mobile/profile" component={MobileProfile} />
          </Switch>
        </main>
        
        {/* Bottom navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t p-2">
          <div className="container max-w-md mx-auto">
            <div className="flex justify-between">
              <Link href="/mobile">
                <a className={cn(
                  "flex flex-col items-center pt-1 pb-0.5 px-3 text-gray-500 hover:text-primary transition-colors",
                  isActive("/mobile") && "text-primary"
                )}>
                  <Home className="h-5 w-5 mb-1" />
                  <span className="text-[10px]">Home</span>
                </a>
              </Link>
              
              <Link href="/mobile/inventory">
                <a className={cn(
                  "flex flex-col items-center pt-1 pb-0.5 px-3 text-gray-500 hover:text-primary transition-colors",
                  isActive("/mobile/inventory") && "text-primary"
                )}>
                  <Package className="h-5 w-5 mb-1" />
                  <span className="text-[10px]">Inventory</span>
                </a>
              </Link>
              
              <Link href="/mobile/scan">
                <a className={cn(
                  "flex flex-col items-center pt-1 pb-0.5 px-3 text-gray-500 hover:text-primary transition-colors",
                  isActive("/mobile/scan") && "text-primary"
                )}>
                  <QrCode className="h-5 w-5 mb-1" />
                  <span className="text-[10px]">Scan</span>
                </a>
              </Link>
              
              <Link href="/mobile/reports">
                <a className={cn(
                  "flex flex-col items-center pt-1 pb-0.5 px-3 text-gray-500 hover:text-primary transition-colors",
                  isActive("/mobile/reports") && "text-primary"
                )}>
                  <FileText className="h-5 w-5 mb-1" />
                  <span className="text-[10px]">Reports</span>
                </a>
              </Link>
              
              <Link href="/mobile/profile">
                <a className={cn(
                  "flex flex-col items-center pt-1 pb-0.5 px-3 text-gray-500 hover:text-primary transition-colors",
                  isActive("/mobile/profile") && "text-primary"
                )}>
                  <User className="h-5 w-5 mb-1" />
                  <span className="text-[10px]">Profile</span>
                </a>
              </Link>
            </div>
          </div>
        </nav>
      </div>
      
      {/* Desktop message */}
      {!isMobile && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md text-center">
            <h2 className="text-xl font-bold mb-2">Mobile View</h2>
            <p className="mb-4">You're viewing the mobile version of PharmStock on a desktop device. For the best experience, please use a mobile device or resize your browser window.</p>
            <Link href="/">
              <a className="inline-block">
                <Button>Return to Desktop Version</Button>
              </a>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}