import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { StockMovementForm } from "@/components/stock/stock-movement-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  ArrowRight, 
  Calendar, 
  Package, 
  UserCircle,
  Plus,
  Users,
  Calculator,
  UserCheck
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  useQuery,
  useMutation 
} from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  StockItem, 
  Category, 
  User, 
  StockMovement,
  StockAllocation
} from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";

export default function StockManagementPage() {
  const { user, hasPermission } = useAuth();
  const { toast } = useToast();
  
  // State for movement modal
  const [showMoveStockModal, setShowMoveStockModal] = useState(false);
  
  // State for allocation modal
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [allocationQuantity, setAllocationQuantity] = useState<string>("");

  // Fetch data
  const { data: stockItems = [] } = useQuery<StockItem[]>({
    queryKey: ["/api/my-specialty-inventory"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: movements = [], isLoading: isLoadingMovements } = useQuery<StockMovement[]>({
    queryKey: ["/api/movements"],
  });

  const { data: allocations = [] } = useQuery<StockAllocation[]>({
    queryKey: ["/api/allocations"],
  });

  // Create movement mutation
  const createMovementMutation = useMutation({
    mutationFn: async (data: { movements: any[] }) => {
      const results = [];
      for (const movement of data.movements) {
        const response = await fetch("/api/movements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(movement),
        });
        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to create movement: ${error}`);
        }
        const result = await response.json();
        results.push(result);
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/movements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-specialty-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/allocations"] });
      setShowMoveStockModal(false);
      toast({
        title: "Success",
        description: "Stock movements created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to move stock",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create allocation mutation
  const createAllocationMutation = useMutation({
    mutationFn: async (data: { userId: number; stockItemId: number; quantity: number; allocatedBy: number }) => {
      const response = await fetch("/api/allocations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create allocation');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/allocations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-specialty-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-allocated-inventory"] });
      setShowAllocationModal(false);
      setSelectedItem(null);
      setSelectedUser("");
      setAllocationQuantity("");
      toast({
        title: "Success",
        description: "Inventory allocated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to allocate inventory",
        variant: "destructive",
      });
    },
  });

  // Helper functions
  const getUserName = (userId: number) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : "Unknown User";
  };

  const getStockItemById = (id: number) => {
    return stockItems.find(item => item.id === id);
  };

  const getCategoryById = (id: number) => {
    return categories.find(cat => cat.id === id);
  };

  const getUserById = (id: number | null) => {
    if (id === null) return { name: "Central Warehouse", role: "warehouse" };
    return users.find(user => user.id === id) || { name: "Unknown User", role: "unknown" };
  };

  const getItemAllocations = (itemId: number) => {
    return allocations.filter(a => a.stockItemId === itemId);
  };

  const getTotalAllocated = (itemId: number) => {
    return getItemAllocations(itemId).reduce((sum, allocation) => sum + allocation.quantity, 0);
  };

  const getAvailableQuantity = (item: StockItem) => {
    return item.quantity - getTotalAllocated(item.id);
  };

  const handleSubmitMovement = (data: any) => {
    createMovementMutation.mutate(data);
  };

  const handleAllocate = () => {
    if (!selectedItem || !selectedUser || !allocationQuantity) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const quantity = parseInt(allocationQuantity);
    const available = getAvailableQuantity(selectedItem);

    if (quantity > available) {
      toast({
        title: "Error",
        description: `Only ${available} items available for allocation`,
        variant: "destructive",
      });
      return;
    }

    createAllocationMutation.mutate({
      userId: parseInt(selectedUser),
      stockItemId: selectedItem.id,
      quantity,
      allocatedBy: user?.id || 1,
    });
  };

  const roleBasedUsers = users.filter(user => 
    ['marketer', 'salesManager', 'medicalRep', 'productManager'].includes(user.role)
  );

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Stock Management</h2>
      </div>

      <Tabs defaultValue="movements" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="movements">Stock Movements</TabsTrigger>
          <TabsTrigger value="allocations">User Allocations</TabsTrigger>
        </TabsList>

        {/* Stock Movements Tab */}
        <TabsContent value="movements" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Stock Movement History</h3>
            {hasPermission("canMoveStock") && (
              <Button onClick={() => setShowMoveStockModal(true)}>
                <ArrowRight className="mr-2 h-4 w-4" />
                Move Stock
              </Button>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Movement History</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingMovements ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                </div>
              ) : movements.length === 0 ? (
                <div className="text-center py-10">
                  <ArrowLeft className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-700">No movement history</h3>
                  <p className="text-gray-500 mt-2">Start moving items between users to see history here.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead>From</TableHead>
                        <TableHead>To</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Processed By</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movements.map((movement) => {
                        const stockItem = getStockItemById(movement.stockItemId);
                        const fromUser = getUserById(movement.fromUserId);
                        const toUser = getUserById(movement.toUserId);
                        const movedByUser = getUserById(movement.movedBy);
                        
                        return (
                          <TableRow key={movement.id}>
                            <TableCell>
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                                <span className="text-sm text-gray-500">{formatDate(movement.movedAt)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Package className="h-4 w-4 text-gray-400 mr-2" />
                                <span className="font-medium">{stockItem?.name || 'Unknown Item'}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <UserCircle className="h-4 w-4 text-gray-400 mr-2" />
                                <span>{fromUser.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <UserCircle className="h-4 w-4 text-gray-400 mr-2" />
                                <span>{toUser.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{movement.quantity}</Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-gray-500">{movedByUser.name}</span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Allocations Tab */}
        <TabsContent value="allocations" className="space-y-6">
          {hasPermission("canManageUsers") && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stockItems.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Allocated</CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {allocations.reduce((sum, a) => sum + a.quantity, 0)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{roleBasedUsers.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Unallocated Items</CardTitle>
                  <Calculator className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stockItems.reduce((sum, item) => sum + getAvailableQuantity(item), 0)}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Inventory Items & Allocations</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Total Quantity</TableHead>
                    <TableHead>Allocated</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead>Allocations</TableHead>
                    {hasPermission("canManageUsers") && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockItems.map((item) => {
                    const totalAllocated = getTotalAllocated(item.id);
                    const available = getAvailableQuantity(item);
                    const itemAllocations = getItemAllocations(item.id);

                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>
                          <Badge variant={totalAllocated > 0 ? "default" : "secondary"}>
                            {totalAllocated}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={available === 0 ? "destructive" : "outline"}>
                            {available}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {itemAllocations.map((allocation) => (
                              <Badge key={allocation.id} variant="secondary" className="text-xs">
                                {getUserName(allocation.userId)}: {allocation.quantity}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        {hasPermission("canManageUsers") && (
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedItem(item);
                                setShowAllocationModal(true);
                              }}
                              disabled={available === 0}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Allocate
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Move Stock Modal */}
      <Dialog open={showMoveStockModal} onOpenChange={setShowMoveStockModal}>
        <DialogContent className="max-w-6xl h-[90vh] w-[95vw] flex flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0 pb-2">
            <DialogTitle>Move Stock</DialogTitle>
            <DialogDescription>
              Select items and recipients to create a stock transfer.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 min-h-0 overflow-hidden">
            <StockMovementForm
              onSubmit={handleSubmitMovement}
              isLoading={createMovementMutation.isPending}
            />
          </div>
          
          <DialogFooter className="flex-shrink-0 pt-2 border-t">
            <Button variant="outline" onClick={() => setShowMoveStockModal(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Allocation Modal */}
      <Dialog open={showAllocationModal} onOpenChange={setShowAllocationModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Allocate Inventory</DialogTitle>
            <DialogDescription>
              Assign inventory to a specific user. This will deduct from available quantity.
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  <strong>{selectedItem.name}</strong> - Available: {getAvailableQuantity(selectedItem)} units
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Select User</label>
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a user to allocate to" />
                    </SelectTrigger>
                    <SelectContent>
                      {roleBasedUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.name} ({user.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Quantity</label>
                  <Input
                    type="number"
                    value={allocationQuantity}
                    onChange={(e) => setAllocationQuantity(e.target.value)}
                    placeholder="Enter quantity to allocate"
                    min="1"
                    max={getAvailableQuantity(selectedItem)}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAllocationModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAllocate}
                    disabled={createAllocationMutation.isPending}
                  >
                    {createAllocationMutation.isPending ? "Allocating..." : "Allocate"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}