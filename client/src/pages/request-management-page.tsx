
import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { RequestForm } from "@/components/requests/request-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  FileText,
  Plus,
  Check,
  X,
  Clock,
  Download,
  MessageSquare
} from "lucide-react";
import { 
  useQuery,
  useMutation 
} from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { InventoryRequest, User } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

export default function RequestManagementPage() {
  const { user, hasPermission } = useAuth();
  const { toast } = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<InventoryRequest | null>(null);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [approvalAction, setApprovalAction] = useState<"approved" | "denied">("approved");

  // Fetch data
  const { data: requests = [], isLoading } = useQuery<InventoryRequest[]>({
    queryKey: ["/api/requests"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Mutations
  const createRequestMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return apiRequest("/api/requests", {
        method: "POST",
        body: formData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      setShowCreateModal(false);
      toast({
        title: "Success",
        description: "Request created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create request",
        variant: "destructive",
      });
    },
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest(`/api/requests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      setShowApprovalModal(false);
      setCurrentRequest(null);
      setApprovalNotes("");
      toast({
        title: "Success",
        description: "Request updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update request",
        variant: "destructive",
      });
    },
  });

  const handleCreateRequest = (formData: FormData) => {
    createRequestMutation.mutate(formData);
  };

  const handleApproval = (action: "approved" | "denied") => {
    if (!currentRequest) return;

    const updateData: any = {
      status: action,
      notes: approvalNotes,
    };

    if (action === "approved") {
      updateData.completedAt = new Date().toISOString();
    }

    updateRequestMutation.mutate({
      id: currentRequest.id,
      data: updateData,
    });
  };

  const getUserName = (userId: number) => {
    const foundUser = users.find(u => u.id === userId);
    return foundUser ? foundUser.name : "Unknown User";
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800", 
      denied: "bg-red-100 text-red-800",
      completed: "bg-blue-100 text-blue-800",
    } as const;

    return (
      <Badge className={variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Filter requests based on user role
  const myRequests = requests.filter(r => r.requestedBy === user?.id);
  const assignedRequests = requests.filter(r => r.assignedTo === user?.id);
  const allRequests = user?.role === 'ceo' || user?.role === 'admin' || user?.role === 'stockKeeper' 
    ? requests 
    : [...myRequests, ...assignedRequests].filter((req, index, self) => 
        index === self.findIndex(r => r.id === req.id)
      );

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Request Management</h1>
            <p className="text-gray-600">
              Manage inventory requests and workflow approvals
            </p>
          </div>
          
          {hasPermission("canCreateRequests") && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Button>
          )}
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Requests</TabsTrigger>
            <TabsTrigger value="my-requests">My Requests</TabsTrigger>
            <TabsTrigger value="assigned">Assigned to Me</TabsTrigger>
            <TabsTrigger value="pending">Pending Approval</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <RequestTable 
              requests={allRequests}
              users={users}
              onView={(request) => {
                setCurrentRequest(request);
                setShowViewModal(true);
              }}
              onApprove={(request) => {
                setCurrentRequest(request);
                setApprovalAction("approved");
                setShowApprovalModal(true);
              }}
              onDeny={(request) => {
                setCurrentRequest(request);
                setApprovalAction("denied");
                setShowApprovalModal(true);
              }}
              currentUser={user}
            />
          </TabsContent>

          <TabsContent value="my-requests">
            <RequestTable 
              requests={myRequests}
              users={users}
              onView={(request) => {
                setCurrentRequest(request);
                setShowViewModal(true);
              }}
              currentUser={user}
            />
          </TabsContent>

          <TabsContent value="assigned">
            <RequestTable 
              requests={assignedRequests}
              users={users}
              onView={(request) => {
                setCurrentRequest(request);
                setShowViewModal(true);
              }}
              onApprove={(request) => {
                setCurrentRequest(request);
                setApprovalAction("approved");
                setShowApprovalModal(true);
              }}
              onDeny={(request) => {
                setCurrentRequest(request);
                setApprovalAction("denied");
                setShowApprovalModal(true);
              }}
              currentUser={user}
            />
          </TabsContent>

          <TabsContent value="pending">
            <RequestTable 
              requests={allRequests.filter(r => r.status === 'pending')}
              users={users}
              onView={(request) => {
                setCurrentRequest(request);
                setShowViewModal(true);
              }}
              onApprove={(request) => {
                setCurrentRequest(request);
                setApprovalAction("approved");
                setShowApprovalModal(true);
              }}
              onDeny={(request) => {
                setCurrentRequest(request);
                setApprovalAction("denied");
                setShowApprovalModal(true);
              }}
              currentUser={user}
            />
          </TabsContent>
        </Tabs>

        {/* Create Request Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Request</DialogTitle>
              <DialogDescription>
                Create a new inventory request with optional file upload
              </DialogDescription>
            </DialogHeader>
            <RequestForm 
              onSubmit={handleCreateRequest}
              isLoading={createRequestMutation.isPending}
            />
          </DialogContent>
        </Dialog>

        {/* Approval Modal */}
        <Dialog open={showApprovalModal} onOpenChange={setShowApprovalModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {approvalAction === "approved" ? "Approve" : "Deny"} Request
              </DialogTitle>
              <DialogDescription>
                {approvalAction === "approved" 
                  ? "Approve this request and optionally add notes"
                  : "Deny this request and provide a reason"
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder={approvalAction === "approved" 
                    ? "Optional approval notes..." 
                    : "Reason for denial..."
                  }
                  className="mt-1"
                />
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setShowApprovalModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleApproval(approvalAction)}
                  variant={approvalAction === "approved" ? "default" : "destructive"}
                  disabled={updateRequestMutation.isPending}
                >
                  {updateRequestMutation.isPending ? "Processing..." : 
                    (approvalAction === "approved" ? "Approve" : "Deny")
                  }
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}

// Request Table Component
interface RequestTableProps {
  requests: InventoryRequest[];
  users: User[];
  onView: (request: InventoryRequest) => void;
  onApprove?: (request: InventoryRequest) => void;
  onDeny?: (request: InventoryRequest) => void;
  currentUser: User | null;
}

function RequestTable({ requests, users, onView, onApprove, onDeny, currentUser }: RequestTableProps) {
  const getUserName = (userId: number) => {
    const foundUser = users.find(u => u.id === userId);
    return foundUser ? foundUser.name : "Unknown User";
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800", 
      denied: "bg-red-100 text-red-800",
      completed: "bg-blue-100 text-blue-800",
    } as const;

    return (
      <Badge className={variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const canApprove = (request: InventoryRequest) => {
    return request.status === 'pending' && 
           (request.assignedTo === currentUser?.id || 
            currentUser?.role === 'stockKeeper' ||
            currentUser?.role === 'ceo' ||
            currentUser?.role === 'admin');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Requests</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Requested By</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="font-medium">{request.title}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {request.type.replace('_', ' ').toLowerCase()}
                  </Badge>
                </TableCell>
                <TableCell>{getUserName(request.requestedBy)}</TableCell>
                <TableCell>
                  {request.assignedTo ? getUserName(request.assignedTo) : "Unassigned"}
                </TableCell>
                <TableCell>{getStatusBadge(request.status)}</TableCell>
                <TableCell>{formatDate(request.createdAt)}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onView(request)}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                    
                    {canApprove(request) && onApprove && (
                      <Button 
                        size="sm" 
                        variant="default"
                        onClick={() => onApprove(request)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {canApprove(request) && onDeny && (
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => onDeny(request)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {request.fileUrl && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => window.open(request.fileUrl!, '_blank')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {requests.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                  No requests found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
