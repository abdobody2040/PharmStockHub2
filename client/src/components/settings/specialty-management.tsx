import { useState } from "react";
import { Specialty } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Edit, Trash2, Plus } from "lucide-react";

const specialtySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof specialtySchema>;

export function SpecialtyManagement() {
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [currentSpecialty, setCurrentSpecialty] = useState<Specialty | null>(null);

  // Fetch specialties
  const { data: specialties = [], isLoading } = useQuery<Specialty[]>({
    queryKey: ["/api/specialties"],
  });

  // Add specialty mutation
  const addSpecialtyMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest("POST", "/api/specialties", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/specialties"] });
      setShowAddDialog(false);
      toast({
        title: "Success",
        description: "Specialty added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add specialty",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update specialty mutation
  const updateSpecialtyMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: FormValues }) => {
      const res = await apiRequest("PUT", `/api/specialties/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/specialties"] });
      setShowEditDialog(false);
      toast({
        title: "Success",
        description: "Specialty updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update specialty",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete specialty mutation
  const deleteSpecialtyMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/specialties/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/specialties"] });
      setShowDeleteAlert(false);
      toast({
        title: "Success",
        description: "Specialty deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete specialty",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form for adding new specialty
  const addForm = useForm<FormValues>({
    resolver: zodResolver(specialtySchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Form for editing specialty
  const editForm = useForm<FormValues>({
    resolver: zodResolver(specialtySchema),
    defaultValues: {
      name: currentSpecialty?.name || "",
      description: currentSpecialty?.description || "",
    },
  });

  // Reset edit form when currentSpecialty changes
  React.useEffect(() => {
    if (currentSpecialty) {
      editForm.reset({
        name: currentSpecialty.name,
        description: currentSpecialty.description || "",
      });
    }
  }, [currentSpecialty, editForm]);

  const onAddSubmit = (data: FormValues) => {
    addSpecialtyMutation.mutate(data);
  };

  const onEditSubmit = (data: FormValues) => {
    if (currentSpecialty) {
      updateSpecialtyMutation.mutate({ id: currentSpecialty.id, data });
    }
  };

  const handleEdit = (specialty: Specialty) => {
    setCurrentSpecialty(specialty);
    setShowEditDialog(true);
  };

  const handleDelete = (specialty: Specialty) => {
    setCurrentSpecialty(specialty);
    setShowDeleteAlert(true);
  };

  const confirmDelete = () => {
    if (currentSpecialty) {
      deleteSpecialtyMutation.mutate(currentSpecialty.id);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading specialties...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Specialty Management</CardTitle>
          <CardDescription>
            Manage specialties for products and medical representatives
          </CardDescription>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Specialty
        </Button>
      </CardHeader>
      <CardContent>
        {specialties.length === 0 ? (
          <div className="text-center p-4 text-gray-500">
            No specialties found. Click "Add Specialty" to create one.
          </div>
        ) : (
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {specialties.map((specialty) => (
                  <TableRow key={specialty.id}>
                    <TableCell className="font-medium">{specialty.name}</TableCell>
                    <TableCell>{specialty.description || '-'}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(specialty)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(specialty)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Add Specialty Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Specialty</DialogTitle>
              <DialogDescription>
                Create a new specialty for products and medical representatives
              </DialogDescription>
            </DialogHeader>
            <Form {...addForm}>
              <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
                <FormField
                  control={addForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name*</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., CNS, Primary care, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Optional description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={addSpecialtyMutation.isPending}>
                    {addSpecialtyMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Edit Specialty Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Specialty</DialogTitle>
              <DialogDescription>
                Update the details of this specialty
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name*</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., CNS, Primary care, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Optional description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateSpecialtyMutation.isPending}>
                    {updateSpecialtyMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Alert */}
        <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the specialty "{currentSpecialty?.name}".
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteSpecialtyMutation.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}