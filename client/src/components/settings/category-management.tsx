import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { HexColorPicker } from "react-colorful";
import { Plus, Edit, Trash2, Save, PaintBucket, Check } from "lucide-react";
import { Category } from "@shared/schema";

export default function CategoryManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState({ name: "", color: "bg-blue-500" });
  const [selectedColor, setSelectedColor] = useState("#3b82f6"); // Default blue color for new categories
  const [editColor, setEditColor] = useState(""); // For editing existing categories
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showEditColorPicker, setShowEditColorPicker] = useState(false);

  // Fetch categories
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    }
  });

  // Add category mutation
  const addCategoryMutation = useMutation({
    mutationFn: async (categoryData: { name: string, color: string }) => {
      const res = await apiRequest("POST", "/api/categories", categoryData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setIsAddDialogOpen(false);
      setNewCategory({ name: "", color: "bg-blue-500" });
      toast({
        title: "Category added",
        description: "Category has been added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add category",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<Category> }) => {
      const res = await apiRequest("PUT", `/api/categories/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setIsEditDialogOpen(false);
      setSelectedCategory(null);
      toast({
        title: "Category updated",
        description: "Category has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update category",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setIsDeleteDialogOpen(false);
      setSelectedCategory(null);
      toast({
        title: "Category deleted",
        description: "Category has been deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete category",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Available colors
  const colorOptions = [
    { name: "Blue", value: "bg-blue-500" },
    { name: "Green", value: "bg-green-500" },
    { name: "Red", value: "bg-red-500" },
    { name: "Purple", value: "bg-purple-500" },
    { name: "Yellow", value: "bg-yellow-500" },
    { name: "Pink", value: "bg-pink-500" },
    { name: "Indigo", value: "bg-indigo-500" },
    { name: "Gray", value: "bg-gray-500" },
  ];

  const handleAddCategory = () => {
    if (!newCategory.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Category name cannot be empty",
        variant: "destructive",
      });
      return;
    }
    addCategoryMutation.mutate(newCategory);
  };

  const handleUpdateCategory = () => {
    if (!selectedCategory) return;
    updateCategoryMutation.mutate({
      id: selectedCategory.id,
      data: {
        name: selectedCategory.name,
        color: selectedCategory.color,
      },
    });
  };

  const handleDeleteCategory = () => {
    if (!selectedCategory) return;
    deleteCategoryMutation.mutate(selectedCategory.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Category Management</h3>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {isLoading ? (
          <p>Loading categories...</p>
        ) : categories.length === 0 ? (
          <p>No categories found. Add one to get started.</p>
        ) : (
          categories.map((category: Category) => (
            <Card key={category.id} className="overflow-hidden">
              <div className={`h-2 ${category.color}`} />
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{category.name}</CardTitle>
              </CardHeader>
              <CardFooter className="flex justify-end space-x-2 pt-0">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSelectedCategory(category);
                    setIsEditDialogOpen(true);
                  }}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-red-500"
                  onClick={() => {
                    setSelectedCategory(category);
                    setIsDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      {/* Add Category Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>
              Create a new category for organizing stock items.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name</Label>
              <Input
                id="name"
                placeholder="Enter category name"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="space-y-4">
                {/* Standard color options */}
                <div className="grid grid-cols-4 gap-2">
                  {colorOptions.map((color) => (
                    <div
                      key={color.value}
                      className={`h-8 rounded-md cursor-pointer ${
                        newCategory.color === color.value ? "ring-2 ring-offset-2 ring-blue-600" : ""
                      } ${color.value}`}
                      onClick={() => {
                        setNewCategory({ ...newCategory, color: color.value });
                        setShowColorPicker(false);
                      }}
                      title={color.name}
                    />
                  ))}
                </div>
                
                {/* Custom color picker */}
                <div className="border rounded-md p-3">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">Custom Color</Label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowColorPicker(!showColorPicker)}
                      className="flex items-center gap-1"
                    >
                      <PaintBucket className="h-4 w-4" />
                      {showColorPicker ? "Hide Palette" : "Show Palette"}
                    </Button>
                  </div>
                  
                  {showColorPicker && (
                    <div className="mt-2 space-y-3">
                      <HexColorPicker
                        color={selectedColor}
                        onChange={(color) => {
                          setSelectedColor(color);
                        }}
                        className="w-full"
                      />
                      <div className="flex mt-2">
                        <div 
                          className="flex-1 h-8 rounded-md border" 
                          style={{ backgroundColor: selectedColor }}
                        />
                        <Button 
                          type="button" 
                          size="sm"
                          className="ml-2"
                          onClick={() => {
                            // Convert hex to tailwind-like class format or use inline style
                            const colorClass = `bg-[${selectedColor}]`; 
                            setNewCategory({ ...newCategory, color: colorClass });
                            setShowColorPicker(false);
                          }}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Apply
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCategory} disabled={addCategoryMutation.isPending}>
              {addCategoryMutation.isPending ? "Adding..." : "Add Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update the category name or color.
            </DialogDescription>
          </DialogHeader>
          {selectedCategory && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Category Name</Label>
                <Input
                  id="edit-name"
                  placeholder="Enter category name"
                  value={selectedCategory.name}
                  onChange={(e) =>
                    setSelectedCategory({ ...selectedCategory, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="space-y-4">
                  {/* Standard color options */}
                  <div className="grid grid-cols-4 gap-2">
                    {colorOptions.map((color) => (
                      <div
                        key={color.value}
                        className={`h-8 rounded-md cursor-pointer ${
                          selectedCategory.color === color.value
                            ? "ring-2 ring-offset-2 ring-blue-600"
                            : ""
                        } ${color.value}`}
                        onClick={() => {
                          setSelectedCategory({ ...selectedCategory, color: color.value });
                          setShowEditColorPicker(false);
                        }}
                        title={color.name}
                      />
                    ))}
                  </div>
                  
                  {/* Custom color picker */}
                  <div className="border rounded-md p-3">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-medium">Custom Color</Label>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowEditColorPicker(!showEditColorPicker)}
                        className="flex items-center gap-1"
                      >
                        <PaintBucket className="h-4 w-4" />
                        {showEditColorPicker ? "Hide Palette" : "Show Palette"}
                      </Button>
                    </div>
                    
                    {showEditColorPicker && (
                      <div className="mt-2 space-y-3">
                        <HexColorPicker
                          color={editColor || "#3b82f6"}
                          onChange={(color) => {
                            setEditColor(color);
                          }}
                          className="w-full"
                        />
                        <div className="flex mt-2">
                          <div 
                            className="flex-1 h-8 rounded-md border" 
                            style={{ backgroundColor: editColor || "#3b82f6" }}
                          />
                          <Button 
                            type="button" 
                            size="sm"
                            className="ml-2"
                            onClick={() => {
                              // Convert hex to tailwind-like class format or use inline style
                              const colorClass = `bg-[${editColor}]`; 
                              setSelectedCategory({ ...selectedCategory, color: colorClass });
                              setShowEditColorPicker(false);
                            }}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Apply
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateCategory}
              disabled={updateCategoryMutation.isPending}
            >
              {updateCategoryMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the category &quot;{selectedCategory?.name}&quot;.
              This action cannot be undone if the category is in use.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              className="bg-red-500 hover:bg-red-600"
              disabled={deleteCategoryMutation.isPending}
            >
              {deleteCategoryMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}