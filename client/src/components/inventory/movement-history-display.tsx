import React from "react";
import { useQuery } from "@tanstack/react-query";
import { StockMovement, User } from "@shared/schema";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Calendar, Package, User as UserIcon } from "lucide-react";

interface MovementHistoryDisplayProps {
  itemId: number;
  showHeader?: boolean;
}

export function MovementHistoryDisplay({ 
  itemId, 
  showHeader = true 
}: MovementHistoryDisplayProps) {
  // Fetch movement history for the specific item
  const { data: movements = [], isLoading } = useQuery<StockMovement[]>({
    queryKey: ["/api/movements", itemId],
    queryFn: async () => {
      const response = await fetch(`/api/movements?itemId=${itemId}`);
      if (!response.ok) throw new Error("Failed to fetch movements");
      return response.json();
    },
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const getUserName = (userId: number | null) => {
    if (!userId) return "Central Inventory";
    const user = users.find(u => u.id === userId);
    return user ? user.name : "Unknown User";
  };

  const getMovementBadge = (movement: StockMovement) => {
    if (!movement.fromUserId) {
      return <Badge variant="secondary">From Central</Badge>;
    }
    if (!movement.toUserId) {
      return <Badge variant="destructive">To Central</Badge>;
    }
    return <Badge variant="default">Transfer</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-200 h-16 rounded"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Movement History</h3>
        </div>
      )}

      {movements.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No movement history found for this item</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {movements.map((movement) => (
            <Card key={movement.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {getMovementBadge(movement)}
                    
                    <div className="flex items-center space-x-2">
                      <div className="text-sm">
                        <span className="font-medium">
                          {getUserName(movement.fromUserId)}
                        </span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                      <div className="text-sm">
                        <span className="font-medium">
                          {getUserName(movement.toUserId)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Package className="h-4 w-4" />
                      <span className="font-medium">{movement.quantity}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(movement.movedAt)}</span>
                    </div>
                  </div>
                </div>

                {movement.notes && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p className="text-sm text-gray-600">{movement.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Example usage in a larger component
export function ItemDetailWithHistory({ itemId }: { itemId: number }) {
  return (
    <div className="space-y-6">
      {/* Other item details would go here */}
      
      <MovementHistoryDisplay itemId={itemId} />
    </div>
  );
}