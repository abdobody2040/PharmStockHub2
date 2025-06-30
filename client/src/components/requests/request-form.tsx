
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { User, StockItem, REQUEST_TYPES } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Upload } from "lucide-react";

const requestSchema = z.object({
  type: z.string().min(1, "Request type is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  assignedTo: z.string().optional(),
  // For inventory sharing workflow
  shareToUserId: z.string().optional(),
  finalAssignee: z.string().optional(),
  items: z.array(z.object({
    stockItemId: z.string().optional(),
    itemName: z.string().optional(),
    quantity: z.string().min(1, "Quantity is required"),
    notes: z.string().optional(),
  })).optional(),
});

type FormValues = z.infer<typeof requestSchema>;

interface RequestFormProps {
  onSubmit: (data: FormData) => void;
  isLoading?: boolean;
}

export function RequestForm({ onSubmit, isLoading = false }: RequestFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [items, setItems] = useState([{ stockItemId: "", itemName: "", quantity: "", notes: "" }]);

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: stockItems = [] } = useQuery<StockItem[]>({
    queryKey: ["/api/stock-items"],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      type: "",
      title: "",
      description: "",
      assignedTo: "",
      items: [],
    },
  });

  const stockKeepers = users.filter(u => u.role === 'stockKeeper');
  const productManagers = users.filter(u => u.role === 'productManager');

  const handleSubmit = (data: FormValues) => {
    const formData = new FormData();
    
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'items') {
        formData.append('items', JSON.stringify(items));
      } else if (value !== undefined && value !== '') {
        formData.append(key, value as string);
      }
    });

    if (selectedFile) {
      formData.append('file', selectedFile);
    }

    onSubmit(formData);
  };

  const addItem = () => {
    setItems([...items, { stockItemId: "", itemName: "", quantity: "", notes: "" }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: string) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setItems(updatedItems);
  };

  const requestType = form.watch("type");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Request Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select request type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={REQUEST_TYPES.PREPARE_ORDER}>
                      Prepare Order (to Stock Keeper)
                    </SelectItem>
                    <SelectItem value={REQUEST_TYPES.INVENTORY_SHARE}>
                      Inventory Share (to Product Manager)
                    </SelectItem>
                    <SelectItem value={REQUEST_TYPES.RECEIVE_INVENTORY}>
                      Receive Inventory (to Stock Keeper)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="assignedTo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assign To</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select assignee" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {requestType === REQUEST_TYPES.INVENTORY_SHARE
                      ? productManagers.map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.name} ({user.username})
                          </SelectItem>
                        ))
                      : stockKeepers.map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.name} ({user.username})
                          </SelectItem>
                        ))
                    }
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder={
                  requestType === REQUEST_TYPES.RECEIVE_INVENTORY 
                    ? "e.g., Incoming Inventory - Pens and Notebooks" 
                    : "Enter request title"
                } {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder={
                    requestType === REQUEST_TYPES.RECEIVE_INVENTORY 
                      ? "Describe the incoming inventory you expect to receive. This will notify the Stock Keeper to prepare for the delivery." 
                      : "Enter request description"
                  }
                  className="min-h-[100px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Final Assignee for Inventory Share workflow */}
        {requestType === REQUEST_TYPES.INVENTORY_SHARE && (
          <FormField
            control={form.control}
            name="finalAssignee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Final Stock Keeper Assignee</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select final stock keeper" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {stockKeepers.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name} ({user.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Excel File (Optional)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="cursor-pointer"
            />
            {selectedFile && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: {selectedFile.name}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Items List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {requestType === REQUEST_TYPES.RECEIVE_INVENTORY ? "Expected Incoming Items" : "Request Items"}
              <Button type="button" onClick={addItem} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </CardTitle>
            {requestType === REQUEST_TYPES.RECEIVE_INVENTORY && (
              <p className="text-sm text-gray-600">
                List all items you expect to receive. This helps the Stock Keeper prepare for incoming inventory.
              </p>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-lg">
                  <div>
                    <label className="text-sm font-medium">
                      {requestType === REQUEST_TYPES.RECEIVE_INVENTORY ? "Existing Stock Item (Optional)" : "Stock Item"}
                    </label>
                    <Select
                      value={item.stockItemId}
                      onValueChange={(value) => updateItem(index, 'stockItemId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select existing item" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No existing item</SelectItem>
                        {stockItems.map((stockItem) => (
                          <SelectItem key={stockItem.id} value={stockItem.id.toString()}>
                            {stockItem.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">
                      {requestType === REQUEST_TYPES.RECEIVE_INVENTORY ? "Item Name" : "Item Name (if not in stock)"}
                    </label>
                    <Input
                      value={item.itemName}
                      onChange={(e) => updateItem(index, 'itemName', e.target.value)}
                      placeholder={requestType === REQUEST_TYPES.RECEIVE_INVENTORY ? "e.g., Pen, Notebook" : "Custom item name"}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">
                      {requestType === REQUEST_TYPES.RECEIVE_INVENTORY ? "Expected Quantity" : "Quantity"}
                    </label>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      placeholder={requestType === REQUEST_TYPES.RECEIVE_INVENTORY ? "e.g., 100" : "0"}
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Notes</label>
                    <Input
                      value={item.notes}
                      onChange={(e) => updateItem(index, 'notes', e.target.value)}
                      placeholder="Optional notes"
                    />
                  </div>

                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Request"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
