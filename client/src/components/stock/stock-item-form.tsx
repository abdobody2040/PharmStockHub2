import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Category, StockItem } from "@shared/schema";
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
import { formatDate } from "@/lib/utils";
import { FormFileInput } from "@/components/ui/file-input";
import { BarcodeActions } from "@/components/barcode/barcode-actions";

interface StockItemFormProps {
  onSubmit: (data: FormData) => void;
  initialData?: StockItem;
  isLoading?: boolean;
}

const stockItemSchema = z.object({
  name: z.string().min(2, "Item name must be at least 2 characters"),
  categoryId: z.string().min(1, "Category is required"),
  quantity: z.string().min(1, "Quantity is required"),
  price: z.string().default("0"),
  expiry: z.string().nullish(),
  uniqueNumber: z.string().optional(),
  imageFile: z.any().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof stockItemSchema>;

export function StockItemForm({ onSubmit, initialData, isLoading = false }: StockItemFormProps) {
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(stockItemSchema),
    defaultValues: {
      name: initialData?.name || "",
      categoryId: initialData?.categoryId.toString() || "",
      quantity: initialData?.quantity.toString() || "",
      price: initialData?.price ? initialData.price.toString() : "0",
      expiry: initialData?.expiry ? new Date(initialData.expiry).toISOString().substring(0, 10) : "",
      uniqueNumber: initialData?.uniqueNumber || "",
      notes: initialData?.notes || "",
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name || "",
        categoryId: initialData.categoryId.toString() || "",
        quantity: initialData.quantity.toString() || "",
        price: initialData.price ? initialData.price.toString() : "0",
        expiry: initialData.expiry ? new Date(initialData.expiry).toISOString().substring(0, 10) : "",
        uniqueNumber: initialData.uniqueNumber || "",
        notes: initialData.notes || "",
      });
    }
  }, [initialData, form]);

  const handleSubmit = (values: FormValues) => {
    const formData = new FormData();
    
    // Add all fields to form data
    formData.append("name", values.name);
    formData.append("categoryId", values.categoryId);
    formData.append("quantity", values.quantity);
    
    // Convert dollar price to cents and store as integer
    const price = parseFloat(values.price);
    const priceInCents = isNaN(price) ? 0 : Math.round(price * 100);
    formData.append("price", priceInCents.toString());
    
    // Handle expiry date properly
    if (values.expiry && values.expiry.trim() !== '') {
      // Ensure proper date format for server processing (ISO format)
      try {
        const dateObj = new Date(values.expiry);
        if (!isNaN(dateObj.getTime())) {
          formData.append("expiry", dateObj.toISOString());
        }
      } catch (e) {
        // If date parsing fails, send the raw string
        formData.append("expiry", values.expiry);
      }
    } else {
      // Explicitly set to null if empty
      formData.append("expiry", "");
    }
    
    if (values.uniqueNumber) {
      formData.append("uniqueNumber", values.uniqueNumber);
    }
    
    if (values.notes) {
      formData.append("notes", values.notes);
    }
    
    if (values.imageFile) {
      formData.append("image", values.imageFile);
    }
    
    onSubmit(formData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Item Name*</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category*</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantity*</FormLabel>
              <FormControl>
                <Input type="number" min="0" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unit Price ($)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min="0" 
                  step="0.01" 
                  {...field} 
                  placeholder="0.00"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="expiry"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expiry Date</FormLabel>
              <FormControl>
                <Input 
                  type="date" 
                  {...field} 
                  value={field.value || ''}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="uniqueNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unique Number</FormLabel>
              <div className="flex space-x-2">
                <FormControl className="flex-1">
                  <Input {...field} />
                </FormControl>
                <BarcodeActions 
                  onScan={(data) => {
                    field.onChange(data);
                    form.setValue("uniqueNumber", data, { shouldValidate: true });
                  }}
                  buttonVariant="outline"
                  buttonSize="icon"
                  showGenerate={false}
                />
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="imageFile"
          render={({ field }) => (
            <FormFileInput
              form={form}
              name="imageFile"
              label="Item Image"
              previewUrl={initialData?.imageUrl || undefined}
            />
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-3">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : initialData ? "Update Item" : "Add Item"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
