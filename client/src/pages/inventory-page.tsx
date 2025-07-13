import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { StockItemCard } from "@/components/stock/stock-item-card";
import { StockItemForm } from "@/components/stock/stock-item-form";
import { SmartSearchFilter } from "@/components/inventory/smart-search-filter";
import { ExportPrintToolbar } from "@/components/reports/export-print-toolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  StockItem, 
  Category, 
  StockMovement,
  User,
  StockAllocation
} from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn, formatDate, calculateDaysRemaining, getExpiryStatus, getExpiryStatusColor, getCategoryColorClass } from "@/lib/utils";
import { 
  LayoutGrid, 
  List, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit,
  Trash2,
  ArrowLeftRight,
  Package,
  QrCode,
  RefreshCw
} from "lucide-react";
import { BarcodeActions } from "@/components/barcode/barcode-actions";

export default function InventoryPage() {
  const { user, hasPermission } = useAuth();
  const { toast } = useToast();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showViewItemModal, setShowViewItemModal] = useState(false);
  const [showEditItemModal, setShowEditItemModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [currentItem, setCurrentItem] = useState<StockItem | null>(null);

  // Fetch data - use specialty-based inventory for inventory management
  const { data: stockItems = [], isLoading: isLoadingItems } = useQuery<StockItem[]>({
    queryKey: ["/api/my-specialty-inventory"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: movements = [] } = useQuery<StockMovement[]>({
    queryKey: ["/api/movements"],
  });

  const { data: allocations = [] } = useQuery<StockAllocation[]>({
    queryKey: ["/api/allocations"],
  });

  // Mutations
  const createItemMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await apiRequest("POST", "/api/stock-items", formData, true);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stock-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-specialty-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/allocations"] });
      setShowAddItemModal(false);
      toast({
        title: "Success",
        description: "Stock item created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: number; formData: FormData }) => {
      const res = await apiRequest("PUT", `/api/stock-items/${id}`, formData, true);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stock-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-specialty-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/allocations"] });
      setShowEditItemModal(false);
      toast({
        title: "Success",
        description: "Stock item updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/stock-items/${id}`);
    },
    onSuccess: () => {
      // Invalidate both stock items and specialty inventory queries
      queryClient.invalidateQueries({ queryKey: ["/api/stock-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-specialty-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-allocated-inventory"] });
      setShowDeleteConfirm(false);
      setCurrentItem(null);
      toast({
        title: "Success",
        description: "Stock item deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filtered items
  const filteredItems = stockItems.filter(item => {
    // Category filter
    if (filterCategory !== "all" && item.categoryId !== parseInt(filterCategory)) {
      return false;
    }
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const category = categories.find(c => c.id === item.categoryId);
      const categoryName = category ? category.name.toLowerCase() : "";
      
      return (
        item.name.toLowerCase().includes(query) ||
        (item.uniqueNumber?.toLowerCase().includes(query)) ||
        categoryName.includes(query)
      );
    }
    
    return true;
  });

  // Get category by id
  const getCategoryById = (categoryId: number) => {
    return categories.find(cat => cat.id === categoryId) || { id: 0, name: "Unknown", color: "bg-gray-500" };
  };

  // Item actions
  const handleViewItem = (item: StockItem) => {
    setCurrentItem(item);
    setShowViewItemModal(true);
  };

  const handleEditItem = (item: StockItem) => {
    setCurrentItem(item);
    setShowEditItemModal(true);
  };

  const handleDeleteItem = (item: StockItem) => {
    setCurrentItem(item);
    setShowDeleteConfirm(true);
  };

  const handleAddItem = (formData: FormData) => {
    createItemMutation.mutate(formData);
  };

  const handleUpdateItem = (formData: FormData) => {
    if (currentItem) {
      updateItemMutation.mutate({ id: currentItem.id, formData });
    }
  };

  const confirmDelete = () => {
    if (currentItem) {
      deleteItemMutation.mutate(currentItem.id);
    }
  };

  // Get stock movement history for an item
  const getItemMovementHistory = (itemId: number) => {
    return movements.filter(m => m.stockItemId === itemId);
  };

  // Functions to resolve relations
  const getUserName = (userId: number | null) => {
    if (!userId) return "Central Warehouse";
    const user = users.find(u => u.id === userId);
    return user ? user.name : "Unknown User";
  };

  // Calculate available amount for an item (total - allocated)
  const getAvailableAmount = (item: StockItem) => {
    const itemAllocations = allocations.filter(alloc => alloc.stockItemId === item.id);
    const totalAllocated = itemAllocations.reduce((sum, alloc) => sum + alloc.quantity, 0);
    const available = Math.max(0, item.quantity - totalAllocated);
    
    // Debug logging for the first few items
    if (item.id === 14 || item.id === 16) {
      console.log(`Item ${item.id} (${item.name}):`, {
        totalQuantity: item.quantity,
        allocations: itemAllocations,
        totalAllocated,
        available
      });
    }
    
    return available;
  };

  // Get allocation details for an item
  const getItemAllocations = (itemId: number) => {
    return allocations.filter(alloc => alloc.stockItemId === itemId);
  };

  // Manual refresh function
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/my-specialty-inventory"] });
    queryClient.invalidateQueries({ queryKey: ["/api/allocations"] });
    queryClient.invalidateQueries({ queryKey: ["/api/stock-items"] });
    queryClient.invalidateQueries({ queryKey: ["/api/movements"] });
    toast({
      title: "Refreshed",
      description: "Inventory data has been refreshed",
    });
  };

  return (
    <MainLayout onSearch={setSearchQuery}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Inventory Management</h2>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setView("grid")}
            className={view === "grid" ? "bg-gray-100" : ""}
          >
            <LayoutGrid className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setView("list")}
            className={view === "list" ? "bg-gray-100" : ""}
          >
            <List className="h-5 w-5" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            title="Refresh inventory data"
          >
            <RefreshCw className="h-5 w-5" />
          </Button>
          
          {hasPermission("canAddItems") && (
            <Button onClick={() => setShowAddItemModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add New Item
            </Button>
          )}
        </div>
      </div>
      
      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
            <div className="relative flex space-x-2">
              <div className="relative flex-1">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search items..."
                  className="pl-10 w-full"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
              <BarcodeActions 
                onScan={(data) => {
                  setSearchQuery(data);
                }}
                buttonVariant="outline"
                buttonSize="default"
                showGenerate={false}
              />
            </div>
            
            <div className="flex flex-wrap space-x-2">
              <Select
                value={filterCategory}
                onValueChange={setFilterCategory}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                More Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Loading state */}
      {isLoadingItems && (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      )}
      
      {/* Empty state */}
      {!isLoadingItems && filteredItems.length === 0 && (
        <Card className="py-10">
          <CardContent className="flex flex-col items-center justify-center text-center p-6">
            <Package className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-700 mb-2">No items found</h3>
            <p className="text-gray-500 mb-6 max-w-md">
              {searchQuery || filterCategory !== "all" 
                ? "Try adjusting your search or filters to find what you're looking for"
                : "Start by adding some stock items to your inventory"}
            </p>
            {hasPermission("canAddItems") && (
              <Button onClick={() => setShowAddItemModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add New Item
              </Button>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Grid View */}
      {!isLoadingItems && filteredItems.length > 0 && view === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <StockItemCard
              key={item.id}
              item={item}
              category={getCategoryById(item.categoryId)}
              onView={handleViewItem}
              onEdit={hasPermission("canEditItems") ? handleEditItem : undefined}
              onDelete={hasPermission("canRemoveItems") ? handleDeleteItem : undefined}
              availableQuantity={getAvailableAmount(item)}
            />
          ))}
        </div>
      )}
      
      {/* List View */}
      {!isLoadingItems && filteredItems.length > 0 && view === "list" && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Unique Number</TableHead>
                <TableHead>Total Qty</TableHead>
                <TableHead>Available Qty</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => {
                const category = getCategoryById(item.categoryId);
                
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="h-10 w-10 rounded object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded bg-gray-200 flex items-center justify-center">
                              <Package className="h-5 w-5 text-gray-500" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("font-medium", getCategoryColorClass(category.name))}>
                        {category.name}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {item.uniqueNumber || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-gray-900">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{item.quantity}</span>
                        <Badge variant="outline" className="text-xs">
                          Total
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-900">
                      <div className="flex items-center space-x-2">
                        <span className={cn(
                          "font-medium",
                          getAvailableAmount(item) === 0 ? "text-red-600" : 
                          getAvailableAmount(item) <= 5 ? "text-orange-600" : "text-green-600"
                        )}>
                          {getAvailableAmount(item)}
                        </span>
                        <Badge variant="outline" className={cn(
                          "text-xs",
                          getAvailableAmount(item) === 0 ? "border-red-200 text-red-600" : 
                          getAvailableAmount(item) <= 5 ? "border-orange-200 text-orange-600" : "border-green-200 text-green-600"
                        )}>
                          Available
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-900">{formatDate(item.expiry)}</div>
                      {item.expiry && (
                        <Badge 
                          variant="outline"
                          className={cn(
                            "mt-1 text-xs",
                            getExpiryStatusColor(getExpiryStatus(item.expiry))
                          )}
                        >
                          {getExpiryStatus(item.expiry) === 'expired' ? 'Expired' : 
                           getExpiryStatus(item.expiry) === 'critical' ? 'Critical' : 
                           getExpiryStatus(item.expiry) === 'warning' ? 'Warning' : 'Safe'}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewItem(item)}
                          className="text-primary hover:text-primary-600"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {hasPermission("canEditItems") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditItem(item)}
                            className="text-green-600 hover:text-green-800"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {hasPermission("canRemoveItems") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteItem(item)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* Add Item Modal */}
      <Dialog open={showAddItemModal} onOpenChange={setShowAddItemModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Stock Item</DialogTitle>
            <DialogDescription>
              Create a new item in your inventory. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <StockItemForm
              onSubmit={handleAddItem}
              isLoading={createItemMutation.isPending}
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddItemModal(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* View Item Modal */}
      <Dialog open={showViewItemModal} onOpenChange={setShowViewItemModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{currentItem?.name}</DialogTitle>
          </DialogHeader>
          
          {currentItem && (
            <div className="mt-4 py-2">
              <div className="flex flex-col sm:flex-row">
                <div className="mb-4 sm:mb-0 sm:mr-4">
                  {currentItem.imageUrl ? (
                    <img
                      src={currentItem.imageUrl}
                      alt={currentItem.name}
                      className="w-full sm:w-40 h-40 object-cover rounded"
                    />
                  ) : (
                    <div className="w-full sm:w-40 h-40 rounded bg-gray-200 flex items-center justify-center">
                      <Package className="h-10 w-10 text-gray-500" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Category</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {getCategoryById(currentItem.categoryId).name}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Unique Number</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {currentItem.uniqueNumber || "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Quantity</dt>
                      <dd className="mt-1 text-sm text-gray-900">{currentItem.quantity}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Price</dt>
                      <dd className="mt-1 text-sm text-gray-900">${currentItem.price ? (currentItem.price / 100).toFixed(2) : '0.00'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Expiry Date</dt>
                      <dd className="mt-1 text-sm text-gray-900 flex items-center">
                        {formatDate(currentItem.expiry)}
                        {currentItem.expiry && (
                          <Badge variant="outline" className={cn(
                            "ml-2",
                            getExpiryStatusColor(getExpiryStatus(currentItem.expiry))
                          )}>
                            {getExpiryStatus(currentItem.expiry) === 'expired' 
                              ? 'Expired' 
                              : `${calculateDaysRemaining(currentItem.expiry)} days`
                            }
                          </Badge>
                        )}
                      </dd>
                    </div>
                    {currentItem.notes && (
                      <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-gray-500">Notes</dt>
                        <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{currentItem.notes}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Stock Movement History</h4>
                <div className="mt-2 border rounded-md overflow-x-auto">
                  {getItemMovementHistory(currentItem.id).length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                      {getItemMovementHistory(currentItem.id).map((movement) => (
                        <li key={movement.id} className="px-4 py-3">
                          <div className="flex flex-col sm:flex-row sm:justify-between">
                            <div>
                              <span className="text-sm font-medium text-gray-900">
                                {getUserName(movement.fromUserId)} → {getUserName(movement.toUserId)}
                              </span>
                              <p className="text-sm text-gray-500">
                                {movement.notes || "No notes"}
                              </p>
                            </div>
                            <div className="text-left sm:text-right mt-1 sm:mt-0">
                              <span className="text-sm text-gray-500">
                                {formatDate(movement.movedAt)}
                              </span>
                              <p className="text-sm font-medium text-gray-900">
                                Qty: {movement.quantity}
                              </p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500">
                      No movement history found
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            {hasPermission("canMoveStock") && (
              <Button className="mr-auto">
                <ArrowLeftRight className="mr-2 h-4 w-4" />
                Move Stock
              </Button>
            )}
            
            {hasPermission("canEditItems") && (
              <Button 
                variant="outline" 
                className="bg-green-50 text-green-600 hover:bg-green-100 border-green-200"
                onClick={() => {
                  setShowViewItemModal(false);
                  setShowEditItemModal(true);
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
            
            <Button variant="outline" onClick={() => setShowViewItemModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Item Modal */}
      <Dialog open={showEditItemModal} onOpenChange={setShowEditItemModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Stock Item</DialogTitle>
            <DialogDescription>
              Update the details of this stock item. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {currentItem && (
              <StockItemForm
                initialData={currentItem}
                onSubmit={handleUpdateItem}
                isLoading={updateItemMutation.isPending}
              />
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditItemModal(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the stock item "{currentItem?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteItemMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
