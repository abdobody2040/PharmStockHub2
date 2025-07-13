import React, { useState } from "react";
import { useDepartmentTransfer } from "@/hooks/use-department-transfer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { User, StockItem } from "@shared/schema";
import { ArrowRight, Package, Users } from "lucide-react";

interface DepartmentTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: StockItem;
  currentAllocation?: {
    userId: number;
    quantity: number;
  };
}

export function DepartmentTransferModal({
  isOpen,
  onClose,
  item,
  currentAllocation,
}: DepartmentTransferModalProps) {
  const [fromUserId, setFromUserId] = useState<number | null>(
    currentAllocation?.userId || null
  );
  const [toUserId, setToUserId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState("");

  const departmentTransfer = useDepartmentTransfer();

  // Fetch users for department selection
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const handleTransfer = async () => {
    if (!toUserId || quantity <= 0) return;

    try {
      await departmentTransfer.mutateAsync({
        itemId: item.id,
        transferData: {
          fromUserId,
          toUserId,
          quantity,
          notes: notes || undefined,
        },
      });
      onClose();
      resetForm();
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  };

  const resetForm = () => {
    setFromUserId(currentAllocation?.userId || null);
    setToUserId(null);
    setQuantity(1);
    setNotes("");
  };

  const getUserName = (userId: number | null) => {
    if (!userId) return "Central Inventory";
    const user = users.find(u => u.id === userId);
    return user ? user.name : "Unknown User";
  };

  const maxQuantity = fromUserId && currentAllocation ? 
    currentAllocation.quantity : 
    item.quantity;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Transfer Item: {item.name}
          </DialogTitle>
          <DialogDescription>
            Move inventory between departments or users. This action will update
            allocations and create a movement record.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Transfer Overview */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <p className="font-medium">Available Quantity</p>
                <p className="text-gray-600">{maxQuantity} units</p>
              </div>
              <div className="text-sm">
                <p className="font-medium">Current Location</p>
                <p className="text-gray-600">{getUserName(fromUserId)}</p>
              </div>
            </div>
          </div>

          {/* Transfer Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fromUser">From Department/User</Label>
              <Select
                value={fromUserId?.toString() || "central"}
                onValueChange={(value) => 
                  setFromUserId(value === "central" ? null : parseInt(value))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="central">Central Inventory</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="toUser">To Department/User *</Label>
              <Select
                value={toUserId?.toString() || ""}
                onValueChange={(value) => setToUserId(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Transfer Arrow & Quantity */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={maxQuantity}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="flex-shrink-0 mt-6">
              <ArrowRight className="h-6 w-6 text-blue-500" />
            </div>
            <div className="flex-1 text-center">
              <p className="text-sm text-gray-600 mb-2">Transfer To</p>
              <p className="font-medium">
                {toUserId ? getUserName(toUserId) : "Select user"}
              </p>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this transfer..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Validation Messages */}
          {quantity > maxQuantity && (
            <div className="text-red-600 text-sm">
              Quantity cannot exceed {maxQuantity} units available
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={
              !toUserId || 
              quantity <= 0 || 
              quantity > maxQuantity ||
              departmentTransfer.isPending
            }
          >
            {departmentTransfer.isPending ? "Transferring..." : "Transfer Item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Example usage component
export function TransferButton({ 
  item, 
  currentAllocation 
}: { 
  item: StockItem; 
  currentAllocation?: { userId: number; quantity: number } 
}) {
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsTransferModalOpen(true)}
      >
        <Users className="h-4 w-4 mr-2" />
        Transfer
      </Button>

      <DepartmentTransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        item={item}
        currentAllocation={currentAllocation}
      />
    </>
  );
}