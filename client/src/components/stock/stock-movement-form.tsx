import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { StockItem, Category, User } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Package, Users } from "lucide-react";

interface StockMovementFormProps {
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

// Helper function to get role display name
const getRoleName = (role: string): string => {
  switch (role) {
    case 'ceo':
      return 'CEO';
    case 'admin':
      return 'Admin';
    case 'productManager':
      return 'Product Manager';
    case 'stockKeeper':
      return 'Stock Keeper';
    case 'medicalRep':
      return 'Medical Rep';
    case 'salesManager':
      return 'Sales Manager';
    default:
      return role;
  }
};

const stockMovementSchema = z.object({
  stockItemId: z.string().min(1, "Stock item is required"),
  toUserId: z.string().min(1, "Recipient is required"),
  quantity: z.string().min(1, "Quantity is required"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof stockMovementSchema>;

export function StockMovementForm({ onSubmit, isLoading = false }: StockMovementFormProps) {
  const [selectedStockItems, setSelectedStockItems] = useState<StockItem[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<User[]>([]);
  const [filterRole, setFilterRole] = useState<string>("all");

  const { data: stockItems = [] } = useQuery<StockItem[]>({
    queryKey: ["/api/stock-items"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { user } = useAuth();

  const form = useForm<FormValues>({
    resolver: zodResolver(stockMovementSchema),
    defaultValues: {
      stockItemId: "",
      toUserId: "",
      quantity: "",
      notes: "",
    },
  });

  const getCategoryForItem = (categoryId: number) => {
    return categories.find(c => c.id === categoryId) || { name: "Unknown", color: "bg-gray-100" };
  };

  const filteredUsers = user?.role === 'ceo'
    ? users
    : filterRole === "all"
      ? users.filter(u => u.role === 'medicalRep' || u.role === 'salesManager')
      : users.filter(u => u.role === filterRole);

  const toggleStockItemSelection = (item: StockItem) => {
    if (selectedStockItems.find(i => i.id === item.id)) {
      setSelectedStockItems(selectedStockItems.filter(i => i.id !== item.id));
    } else {
      setSelectedStockItems([...selectedStockItems, item]);

      // Set form value if it's the first selection
      if (selectedStockItems.length === 0) {
        form.setValue("stockItemId", item.id.toString());
      }
    }
  };

  const isStockItemSelected = (itemId: number) => {
    return !!selectedStockItems.find(i => i.id === itemId);
  };

  const toggleRecipientSelection = (user: User) => {
    if (selectedRecipients.find(u => u.id === user.id)) {
      setSelectedRecipients(selectedRecipients.filter(u => u.id !== user.id));
    } else {
      setSelectedRecipients([...selectedRecipients, user]);

      // Set form value if it's the first selection
      if (selectedRecipients.length === 0) {
        form.setValue("toUserId", user.id.toString());
      }
    }
  };

  const isRecipientSelected = (userId: number) => {
    return !!selectedRecipients.find(u => u.id === userId);
  };

  const handleSubmit = (values: FormValues) => {
    const movementData = {
      stockItemId: parseInt(values.stockItemId),
      toUserId: parseInt(values.toUserId),
      quantity: parseInt(values.quantity),
      notes: values.notes,
    };

    onSubmit(movementData);
  };

  return (
    <div className="flex flex-col gap-4 h-full max-h-[75vh] overflow-hidden">
      {/* Stock Items Section */}
      <div className="bg-white rounded-lg shadow flex-shrink-0">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">Available Stock</h3>
          <p className="text-sm text-gray-500 mt-1">Select items to move</p>
        </div>
        <div className="p-4 max-h-48 overflow-y-auto">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox />
                  </TableHead>
                  <TableHead className="min-w-[200px]">Item</TableHead>
                  <TableHead className="min-w-[100px]">Category</TableHead>
                  <TableHead className="min-w-[80px]">Available</TableHead>
                  <TableHead className="min-w-[80px]">Move Qty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockItems.map((item) => (
                  <TableRow key={item.id} className={isStockItemSelected(item.id) ? "bg-blue-50" : ""}>
                    <TableCell>
                      <Checkbox 
                        checked={isStockItemSelected(item.id)}
                        onCheckedChange={() => toggleStockItemSelection(item)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center min-w-0">
                        {item.imageUrl ? (
                          <div className="h-8 w-8 flex-shrink-0">
                            <img 
                              src={item.imageUrl} 
                              alt={item.name} 
                              className="h-8 w-8 rounded object-cover" 
                            />
                          </div>
                        ) : (
                          <div className="h-8 w-8 flex-shrink-0 bg-gray-200 rounded flex items-center justify-center">
                            <Package className="h-4 w-4 text-gray-500" />
                          </div>
                        )}
                        <div className="ml-3 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{item.name}</div>
                          <div className="text-xs text-gray-500 truncate">{item.uniqueNumber}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-medium text-xs">
                        {getCategoryForItem(item.categoryId).name}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{item.quantity}</TableCell>
                    <TableCell>
                      <Input 
                        type="number"
                        min="0"
                        max={item.quantity.toString()}
                        disabled={!isStockItemSelected(item.id)}
                        className="w-16 h-8 text-sm"
                        defaultValue="0"
                        onInput={(e) => {
                          if (isStockItemSelected(item.id)) {
                            form.setValue("stockItemId", item.id.toString());
                            form.setValue("quantity", e.currentTarget.value);
                          }
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Recipients and Form Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 overflow-hidden">
        {/* Recipients */}
        <div className="bg-white rounded-lg shadow flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200 flex-shrink-0">
            <h3 className="text-lg font-medium text-gray-800">Recipients</h3>
            <div className="mt-2">
              <Select 
                value={filterRole}
                onValueChange={setFilterRole}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Recipients</SelectItem>
                  <SelectItem value="medicalRep">Medical Representatives</SelectItem>
                  <SelectItem value="salesManager">Sales Managers</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="p-4 flex-1 overflow-y-auto">
            <ul className="space-y-2">
              {filteredUsers.map((user) => (
                <li 
                  key={user.id}
                  className="p-2 flex items-center justify-between hover:bg-gray-50 rounded-md cursor-pointer"
                  onClick={() => toggleRecipientSelection(user)}
                >
                  <div className="flex items-center min-w-0">
                    <Checkbox 
                      checked={isRecipientSelected(user.id)}
                      onCheckedChange={() => toggleRecipientSelection(user)}
                      className="mr-2"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.region || "No region"}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-xs ml-2 ${user.role === 'medicalRep' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                    {getRoleName(user.role)}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Movement Form */}
        <div className="bg-white rounded-lg shadow flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200 flex-shrink-0">
            <h3 className="text-lg font-medium text-gray-800">Movement Details</h3>
          </div>
          <div className="p-4 flex-1 overflow-y-auto">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 h-full flex flex-col">
                <FormField
                  control={form.control}
                  name="stockItemId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Selected Item</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={selectedStockItems.length === 0}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Select an item" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedStockItems.map(item => (
                              <SelectItem key={item.id} value={item.id.toString()}>
                                {item.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="toUserId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Recipient</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={selectedRecipients.length === 0}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Select a recipient" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedRecipients.map(user => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                {user.name} ({getRoleName(user.role)})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Quantity to Move</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" className="h-8" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea rows={2} className="text-sm" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end pt-4 mt-auto border-t border-gray-100">
                  <Button type="submit" disabled={isLoading} className="h-9 px-6">
                    {isLoading ? "Processing..." : "Confirm Transfer"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}