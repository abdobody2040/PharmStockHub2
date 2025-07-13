import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

// Types for the department transfer
interface DepartmentTransferRequest {
  fromUserId?: number | null; // Optional: null for central inventory
  toUserId: number;
  quantity: number;
  notes?: string;
}

interface DepartmentTransferResponse {
  success: boolean;
  message: string;
  data: {
    item: any;
    allocations: any[];
    movement: any;
    transferDetails: {
      fromUserId: number | null;
      toUserId: number;
      quantity: number;
      notes: string;
    };
  };
}

export function useDepartmentTransfer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      itemId, 
      transferData 
    }: { 
      itemId: number; 
      transferData: DepartmentTransferRequest 
    }): Promise<DepartmentTransferResponse> => {
      const response = await fetch(`/api/items/${itemId}/transfer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transferData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to transfer item");
      }

      return response.json();
    },
    onSuccess: (data, { itemId }) => {
      // Invalidate and refetch all related queries
      queryClient.invalidateQueries({ queryKey: ["/api/stock-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock-items", itemId] });
      queryClient.invalidateQueries({ queryKey: ["/api/allocations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/movements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-allocated-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-specialty-inventory"] });
      
      // Show success toast
      toast({
        title: "Success",
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Transfer Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Hook for getting movement history for a specific item
export function useMovementHistory(itemId: number) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/movements?itemId=${itemId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch movement history");
      }
      return response.json();
    },
    onSuccess: (data) => {
      // Update movement history cache
      queryClient.setQueryData(["/api/movements", itemId], data);
    },
  });
}

// Helper hook for refreshing all inventory-related queries
export function useInventoryRefresh() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ["/api/stock-items"] });
    queryClient.invalidateQueries({ queryKey: ["/api/allocations"] });
    queryClient.invalidateQueries({ queryKey: ["/api/movements"] });
    queryClient.invalidateQueries({ queryKey: ["/api/my-allocated-inventory"] });
    queryClient.invalidateQueries({ queryKey: ["/api/my-specialty-inventory"] });
  };
}