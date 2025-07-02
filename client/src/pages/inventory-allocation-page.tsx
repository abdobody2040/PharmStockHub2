import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Package, 
  Plus, 
  Minus, 
  UserCheck, 
  AlertTriangle,
  Calculator,
  Users
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { StockItem, StockAllocation, SafeUser } from "@shared/schema";

export default function InventoryAllocationPage() {
  const { toast } = useToast();
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [allocationQuantity, setAllocationQuantity] = useState<string>("");

  // Fetch data
  const { data: stockItems = [], isLoading: itemsLoading } = useQuery<StockItem[]>({
    queryKey: ["/api/stock-items"],
  });

  const { data: users = [] } = useQuery<SafeUser[]>({
    queryKey: ["/api/users"],
  });

  const { data: allocations = [] } = useQuery<StockAllocation[]>({
    queryKey: ["/api/allocations"],
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

  const getUserRole = (userId: number) => {
    const user = users.find(u => u.id === userId);
    return user ? user.role : "";
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
      allocatedBy: 1, // Current user ID - should be from auth context
    });
  };

  const roleBasedUsers = users.filter(user => 
    !['admin', 'stockKeeper', 'ceo'].includes(user.role)
  );

  if (itemsLoading) {
    return (
      <MainLayout>
        <div>Loading...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Inventory Allocation</h1>
            <p className="text-gray-600">
              Assign inventory to specific roles and track allocations
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

        {/* Inventory Allocation Table */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory Items & Allocations</CardTitle>
            <CardDescription>
              View current allocations and available quantities for each item
            </CardDescription>
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
                  <TableHead>Actions</TableHead>
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
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

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
                  <AlertTriangle className="h-4 w-4" />
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
      </div>
    </MainLayout>
  );
}