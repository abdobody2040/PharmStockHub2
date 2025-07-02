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
function getRoleName(role: string): string {
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
}

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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">Available Stock</h3>
          <p className="text-sm text-gray-500 mt-1">Select items to move</p>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox />
                  </TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Available Qty</TableHead>
                  <TableHead>Move Qty</TableHead>
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
                      <div className="flex items-center">
                        {item.imageUrl ? (
                          <div className="h-10 w-10 flex-shrink-0">
                            <img 
                              src={item.imageUrl} 
                              alt={item.name} 
                              className="h-10 w-10 rounded object-cover" 
                            />
                          </div>
                        ) : (
                          <div className="h-10 w-10 flex-shrink-0 bg-gray-200 rounded flex items-center justify-center">
                            <span className="text-xs text-gray-500">No img</span>
                          </div>
                        )}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-500">{item.uniqueNumber}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-medium">
                        {getCategoryForItem(item.categoryId).name}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>
                      <Input 
                        type="number"
                        min="0"
                        max={item.quantity.toString()}
                        disabled={!isStockItemSelected(item.id)}
                        className="w-20"
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

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">Recipients</h3>
          <div className="mt-2">
            <Select 
              value={filterRole}
              onValueChange={setFilterRole}
            >
              <SelectTrigger>
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
        <div className="p-6">
          <ul className="divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <li 
                key={user.id}
                className="py-4 flex items-center justify-between hover:bg-gray-50 rounded-md px-2 cursor-pointer"
                onClick={() => toggleRecipientSelection(user)}
              >
                <div className="flex items-center">
                  <Checkbox 
                    checked={isRecipientSelected(user.id)}
                    onCheckedChange={() => toggleRecipientSelection(user)}
                    className="mr-2"
                  />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.region || "No region"}</p>
                  </div>
                </div>
                <Badge variant="outline" className={user.role === 'medicalRep' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}>
                  {getRoleName(user.role)}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="lg:col-span-3">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Movement Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="stockItemId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Selected Item</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={selectedStockItems.length === 0}
                      >
                        <SelectTrigger>
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
                    <FormLabel>Recipient</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={selectedRecipients.length === 0}
                      >
                        <SelectTrigger>
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
                    <FormLabel>Quantity to Move</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
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
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea rows={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="mt-6 flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Processing..." : "Confirm Transfer"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}