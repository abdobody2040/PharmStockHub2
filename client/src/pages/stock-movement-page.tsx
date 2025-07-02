
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StockMovementForm } from "@/components/stock/stock-movement-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, ArrowUpDown, Package, User } from "lucide-react";
import { format } from "date-fns";

interface StockMovement {
  id: number;
  stockItemId: number;
  fromUserId: number | null;
  toUserId: number;
  quantity: number;
  reason: string;
  createdAt: string;
  stockItem?: {
    name: string;
    sku: string;
  };
  fromUser?: {
    name: string;
  };
  toUser?: {
    name: string;
  };
}

interface StockItem {
  id: number;
  name: string;
  sku: string;
  quantity: number;
  categoryId: number;
  category?: {
    name: string;
    color: string;
  };
}

export default function StockMovementPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: movements = [], isLoading: movementsLoading } = useQuery({
    queryKey: ["stock-movements"],
    queryFn: async () => {
      const response = await fetch("/api/stock-movements");
      if (!response.ok) throw new Error("Failed to fetch movements");
      return response.json();
    },
  });

  const { data: stockItems = [] } = useQuery({
    queryKey: ["stock-items"],
    queryFn: async () => {
      const response = await fetch("/api/stock-items");
      if (!response.ok) throw new Error("Failed to fetch stock items");
      return response.json();
    },
  });

  const createMovement = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/stock-movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create movement");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      queryClient.invalidateQueries({ queryKey: ["stock-items"] });
      setIsFormOpen(false);
    },
  });

  const handleSubmit = (data: any) => {
    createMovement.mutate(data);
  };

  if (movementsLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stock Movements</h1>
          <p className="text-muted-foreground">
            Track and manage inventory transfers between users
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Movement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Stock Movement</DialogTitle>
            </DialogHeader>
            <StockMovementForm
              stockItems={stockItems}
              onSubmit={handleSubmit}
              isLoading={createMovement.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5" />
            Recent Movements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map((movement: StockMovement) => (
                <TableRow key={movement.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      <div>
                        <div className="font-medium">
                          {movement.stockItem?.name || `Item ${movement.stockItemId}`}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {movement.stockItem?.sku}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {movement.fromUser?.name || "System"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {movement.toUser?.name || "Unknown"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{movement.quantity}</Badge>
                  </TableCell>
                  <TableCell>{movement.reason}</TableCell>
                  <TableCell>
                    {format(new Date(movement.createdAt), "MMM dd, yyyy")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
