import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { User, StockItem } from "@shared/schema";
import { getRoleName } from "@shared/roles";
import { useAuth } from "@/hooks/use-auth";
import { 
  Package, 
  Users, 
  ArrowRight,
  Minus,
  Plus,
  Search,
  UserCircle
} from "lucide-react";

const movementSchema = z.object({
  notes: z.string().optional(),
});

type MovementFormData = z.infer<typeof movementSchema>;

interface StockMovementFormProps {
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

interface StockAllocation {
  id: number;
  userId: number;
  stockItemId: number;
  quantity: number;
  allocatedAt: string;
  allocatedBy: number;
}

interface SelectedStockItem {
  stockItem: StockItem;
  quantity: number;
}

export function StockMovementForm({ onSubmit, isLoading = false }: StockMovementFormProps) {
  const { user } = useAuth();
  const [selectedStockItems, setSelectedStockItems] = useState<SelectedStockItem[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<User[]>([]);
  const [stockSearchTerm, setStockSearchTerm] = useState("");
  const [recipientSearchTerm, setRecipientSearchTerm] = useState("");

  const form = useForm<MovementFormData>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      notes: "",
    },
  });

  // Get role name helper function
  const getRoleName = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrator";
      case "stockKeeper":
        return "Stock Keeper";
      case "productManager":
        return "Product Manager";
      case "auditor":
        return "Auditor";
      default:
        return role;
    }
  };

  // Fetch available stock items - use specialty-based inventory for movement
  const { data: stockItems = [] } = useQuery<StockItem[]>({
    queryKey: ["/api/my-specialty-inventory"],
  });

  // Fetch users who can receive stock
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
  });

  const { data: allocations = [] } = useQuery<StockAllocation[]>({
    queryKey: ["allocations"],
    queryFn: async () => {
      const response = await fetch("/api/allocations");
      if (!response.ok) throw new Error("Failed to fetch allocations");
      return response.json();
    },
  });

  // Filter users to exclude current user and include warehouse option
  const availableRecipients = users.filter(u => u.id !== user?.id);

  // Filter stock items based on search
  const filteredStockItems = stockItems.filter(item =>
    item.name.toLowerCase().includes(stockSearchTerm.toLowerCase()) ||
    item.uniqueNumber?.toLowerCase().includes(stockSearchTerm.toLowerCase())
  );

  // Filter recipients based on search
  const filteredRecipients = availableRecipients.filter(recipient =>
    recipient.name.toLowerCase().includes(recipientSearchTerm.toLowerCase()) ||
    getRoleName(recipient.role).toLowerCase().includes(recipientSearchTerm.toLowerCase())
  );

  const handleStockItemSelect = (stockItem: StockItem) => {
    const existingIndex = selectedStockItems.findIndex(item => item.stockItem.id === stockItem.id);
    if (existingIndex === -1) {
      setSelectedStockItems([...selectedStockItems, { stockItem, quantity: 1 }]);
    }
  };

  const handleStockItemRemove = (stockItemId: number) => {
    setSelectedStockItems(selectedStockItems.filter(item => item.stockItem.id !== stockItemId));
  };

  const handleQuantityChange = (stockItemId: number, change: number) => {
    setSelectedStockItems(selectedStockItems.map(item => {
      if (item.stockItem.id === stockItemId) {
        const newQuantity = Math.max(1, item.quantity + change);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const handleQuantityInput = (stockItemId: number, value: string) => {
    const numValue = parseInt(value) || 1;
    setSelectedStockItems(selectedStockItems.map(item => {
      if (item.stockItem.id === stockItemId) {
        return { ...item, quantity: Math.max(1, numValue) };
      }
      return item;
    }));
  };

  const handleRecipientToggle = (recipient: User) => {
    const isSelected = selectedRecipients.some(r => r.id === recipient.id);
    if (isSelected) {
      setSelectedRecipients(selectedRecipients.filter(r => r.id !== recipient.id));
    } else {
      setSelectedRecipients([...selectedRecipients, recipient]);
    }
  };

  const handleSubmit = (data: MovementFormData) => {
    const movements = [];

    for (const recipient of selectedRecipients) {
      for (const selectedItem of selectedStockItems) {
        // Determine if movement should come from central inventory or user allocation
        // Admins, CEOs, and Stock Keepers move from central inventory (fromUserId = null)
        // Other users move from their allocated stock (fromUserId = user.id)
        const isFromCentralInventory = user?.role === 'admin' || 
                                      user?.role === 'ceo' || 
                                      user?.role === 'stockKeeper';
        
        movements.push({
          stockItemId: selectedItem.stockItem.id,
          fromUserId: isFromCentralInventory ? null : user?.id || null,
          toUserId: recipient.id,
          quantity: selectedItem.quantity,
          notes: data.notes || "",
          movedBy: user?.id || null,
        });
      }
    }

    onSubmit({ movements });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto space-y-6 p-1">
        {/* Stock Items Selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Package className="mr-2 h-5 w-5" />
              Select Stock Items
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Stock Items */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search stock items..."
                value={stockSearchTerm}
                onChange={(e) => setStockSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Selected Stock Items */}
            {selectedStockItems.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Selected Items:</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {selectedStockItems.map(({ stockItem, quantity }) => (
                    <div key={stockItem.id} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg border">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 flex-shrink-0">
                          {stockItem.imageUrl ? (
                            <img 
                              src={stockItem.imageUrl}
                              alt={stockItem.name}
                              className="h-8 w-8 rounded object-cover"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded bg-gray-200 flex items-center justify-center">
                              <Package className="h-4 w-4 text-gray-500" />
                            </div>
                          )}
                        </div>
                        <div>
                          <span className="text-sm font-medium">{stockItem.name}</span>
                          <div className="text-xs text-gray-500">{stockItem.uniqueNumber}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(stockItem.id, -1)}
                          className="h-8 w-8 p-0"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          value={quantity}
                          onChange={(e) => handleQuantityInput(stockItem.id, e.target.value)}
                          className="h-8 w-16 text-center text-sm"
                          min="1"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(stockItem.id, 1)}
                          className="h-8 w-8 p-0"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStockItemRemove(stockItem.id)}
                          className="h-8 px-2 text-red-600 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available Stock Items */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Available Items:</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                {filteredStockItems
                  .filter(item => !selectedStockItems.some(selected => selected.stockItem.id === item.id))
                  .map((stockItem) => (
                    <div
                      key={stockItem.id}
                      className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleStockItemSelect(stockItem)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 flex-shrink-0">
                          {stockItem.imageUrl ? (
                            <img 
                              src={stockItem.imageUrl}
                              alt={stockItem.name}
                              className="h-10 w-10 rounded object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded bg-gray-200 flex items-center justify-center">
                              <Package className="h-5 w-5 text-gray-500" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{stockItem.name}</p>
                          <p className="text-xs text-gray-500 truncate">{stockItem.uniqueNumber}</p>
                          <Badge variant="secondary" className="text-xs">
                            Qty: {stockItem.quantity}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Recipients Selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Select Recipients
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Recipients */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search recipients..."
                value={recipientSearchTerm}
                onChange={(e) => setRecipientSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Selected Recipients */}
            {selectedRecipients.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Selected Recipients:</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedRecipients.map((recipient) => (
                    <Badge key={recipient.id} variant="secondary" className="flex items-center space-x-1">
                      <UserCircle className="h-3 w-3" />
                      <span>{recipient.name}</span>
                      <span className="text-xs">({getRoleName(recipient.role)})</span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Available Recipients */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Available Recipients:</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {filteredRecipients.map((recipient) => {
                  const isSelected = selectedRecipients.some(r => r.id === recipient.id);
                  return (
                    <div
                      key={recipient.id}
                      className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleRecipientToggle(recipient)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onChange={() => handleRecipientToggle(recipient)}
                      />
                      <UserCircle className="h-8 w-8 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{recipient.name}</p>
                        <p className="text-xs text-gray-500">{getRoleName(recipient.role)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Movement Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Movement Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this stock movement..."
                  {...form.register("notes")}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fixed Footer with Buttons on Same Line */}
      <div className="flex-shrink-0 border-t bg-white p-4 mt-4">
        <div className="flex justify-end space-x-3">
          <Button 
            type="button" 
            variant="outline"
            onClick={() => {
              setSelectedStockItems([]);
              setSelectedRecipients([]);
              form.reset();
            }}
            className="px-6 py-2"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading || selectedStockItems.length === 0 || selectedRecipients.length === 0}
            onClick={form.handleSubmit(handleSubmit)}
            className="px-6 py-2"
          >
            {isLoading ? "Processing..." : "Confirm Transfer"}
          </Button>
        </div>
      </div>
    </div>
  );
}