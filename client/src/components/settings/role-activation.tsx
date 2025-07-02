import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Save, Users, Shield } from "lucide-react";
import { RoleType } from "@shared/schema";

const ALL_ROLES = [
  { id: 'ceo', name: 'CEO', description: 'Chief Executive Officer - Full system access', color: 'bg-purple-100 text-purple-800' },
  { id: 'admin', name: 'Administrator', description: 'System administrator with management privileges', color: 'bg-blue-100 text-blue-800' },
  { id: 'productManager', name: 'Product Manager', description: 'Manages inventory requests and product planning', color: 'bg-green-100 text-green-800' },
  { id: 'stockKeeper', name: 'Stock Keeper', description: 'Manages physical inventory and stock movements', color: 'bg-orange-100 text-orange-800' },
  { id: 'marketer', name: 'Marketer', description: 'Marketing team members with specialty access', color: 'bg-pink-100 text-pink-800' },
  { id: 'salesManager', name: 'Sales Manager', description: 'Regional sales management and reporting', color: 'bg-indigo-100 text-indigo-800' },
  { id: 'stockManager', name: 'Stock Manager', description: 'Inventory oversight and stock management', color: 'bg-cyan-100 text-cyan-800' },
  { id: 'medicalRep', name: 'Medical Representative', description: 'Field representatives with specialty access', color: 'bg-yellow-100 text-yellow-800' },
];

export function RoleActivation() {
  const { toast } = useToast();
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const { data: activeRoles = [], isLoading } = useQuery<string[]>({
    queryKey: ["/api/active-roles"],
  });

  const updateRolesMutation = useMutation({
    mutationFn: async (roles: string[]) => {
      const response = await fetch("/api/active-roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roles }),
      });
      if (!response.ok) throw new Error('Failed to update roles');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/active-roles"] });
      toast({
        title: "Success",
        description: "Active roles updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update active roles",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (activeRoles.length > 0) {
      setSelectedRoles(activeRoles);
    }
  }, [activeRoles]);

  const handleRoleToggle = (roleId: string) => {
    setSelectedRoles(prev => {
      if (prev.includes(roleId)) {
        return prev.filter(id => id !== roleId);
      } else {
        return [...prev, roleId];
      }
    });
  };

  const handleSave = () => {
    if (selectedRoles.length === 0) {
      toast({
        title: "Warning",
        description: "At least one role must be selected",
        variant: "destructive",
      });
      return;
    }
    updateRolesMutation.mutate(selectedRoles);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Role Activation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Role Activation Management
        </CardTitle>
        <CardDescription>
          Select which roles should be available in the system navigation. Only selected roles will appear in the sidebar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
          {ALL_ROLES.map((role) => (
            <div
              key={role.id}
              className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Checkbox
                id={role.id}
                checked={selectedRoles.includes(role.id)}
                onCheckedChange={() => handleRoleToggle(role.id)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <label
                    htmlFor={role.id}
                    className="text-sm font-medium cursor-pointer"
                  >
                    {role.name}
                  </label>
                  <Badge className={role.color}>
                    {role.id}
                  </Badge>
                  {selectedRoles.includes(role.id) && (
                    <Badge variant="secondary" className="text-xs">
                      <Shield className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-600">{role.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-gray-600">
            {selectedRoles.length} of {ALL_ROLES.length} roles selected
          </div>
          <Button
            onClick={handleSave}
            disabled={updateRolesMutation.isPending || selectedRoles.length === 0}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {updateRolesMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}