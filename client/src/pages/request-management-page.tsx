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
import { InventoryRequest, SafeUser } from "@shared/schema";
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

  const { data: users = [] } = useQuery<SafeUser[]>({
    queryKey: ["/api/users"],
  });

  const { data: specialties = [] } = useQuery({
    queryKey: ["/api/specialties"],
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
  });

  const { data: stockItems = [] } = useQuery({
    queryKey: ["/api/stock-items"],
  });

  // Fetch detailed request data including items when viewing a request
  const { data: requestDetails } = useQuery({
    queryKey: [`/api/requests/${currentRequest?.id}`],
    enabled: !!currentRequest?.id && showViewModal,
  });

  const requestItems = requestDetails?.items || [];
  
  // Debug logging
  console.log("Request details:", requestDetails);
  console.log("Request items:", requestItems);

  // Mutations
  const createRequestMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/requests", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to create request');
      return response.json();
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
      const response = await fetch(`/api/requests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update request');
      return response.json();
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

  const approveAndForwardMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes?: string }) => {
      const response = await fetch(`/api/requests/${id}/approve-and-forward`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (!response.ok) throw new Error('Failed to approve and forward request');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      setShowApprovalModal(false);
      setCurrentRequest(null);
      setApprovalNotes("");
      toast({
        title: "Success",
        description: "Request approved and forwarded to Stock Keeper",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve and forward request",
        variant: "destructive",
      });
    },
  });

  const finalApproveMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes?: string }) => {
      const response = await fetch(`/api/requests/${id}/final-approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (!response.ok) throw new Error('Failed to final approve request');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      setShowApprovalModal(false);
      setCurrentRequest(null);
      setApprovalNotes("");
      toast({
        title: "Success",
        description: "Request finally approved and completed",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to final approve request",
        variant: "destructive",
      });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes?: string }) => {
      const response = await fetch(`/api/requests/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (!response.ok) throw new Error('Failed to approve request');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      setShowApprovalModal(false);
      setCurrentRequest(null);
      setApprovalNotes("");
      toast({
        title: "Success",
        description: "Request approved and inventory transferred",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve request",
        variant: "destructive",
      });
    },
  });

  const denyMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes?: string }) => {
      const response = await fetch(`/api/requests/${id}/deny`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (!response.ok) throw new Error('Failed to deny request');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      setShowApprovalModal(false);
      setCurrentRequest(null);
      setApprovalNotes("");
      toast({
        title: "Success",
        description: "Request denied",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to deny request",
        variant: "destructive",
      });
    },
  });

  const handleCreateRequest = (formData: FormData) => {
    createRequestMutation.mutate(formData);
  };

  const handleApproval = (action: "approved" | "denied") => {
    if (!currentRequest) return;

    if (action === "approved") {
      // Use the specific approve endpoint for proper inventory transfer
      approveMutation.mutate({
        id: currentRequest.id,
        notes: approvalNotes,
      });
    } else {
      // Use the specific deny endpoint
      denyMutation.mutate({
        id: currentRequest.id,
        notes: approvalNotes,
      });
    }
  };

  const handleApproveAndForward = () => {
    if (!currentRequest) return;

    approveAndForwardMutation.mutate({
      id: currentRequest.id,
      notes: approvalNotes,
    });
  };

  const handleFinalApprove = () => {
    if (!currentRequest) return;

    finalApproveMutation.mutate({
      id: currentRequest.id,
      notes: approvalNotes,
    });
  };

  const handleApprovalAction = (action: "approved" | "denied") => {
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

  const getStockItemName = (stockItemId: number | null) => {
    if (!stockItemId) return null;
    const foundItem = stockItems.find((item: any) => item.id === stockItemId);
    return foundItem ? foundItem.name : `Item #${stockItemId}`;
  };

  const getStockItemDetails = (stockItemId: number | null) => {
    if (!stockItemId) return null;
    const foundItem = stockItems.find((item: any) => item.id === stockItemId);
    return foundItem || null;
  };

  const getSpecialtyName = (specialtyId: number | null) => {
    if (!specialtyId) return null;
    const foundSpecialty = specialties.find((specialty: any) => specialty.id === specialtyId);
    return foundSpecialty ? foundSpecialty.name : `Specialty #${specialtyId}`;
  };

  const getUserSpecialty = (userId: number) => {
    const foundUser = users.find(u => u.id === userId);
    return foundUser?.specialtyId ? getSpecialtyName(foundUser.specialtyId) : null;
  };

  const getUserName = (userId: number) => {
    const foundUser = users.find(u => u.id === userId);
    return foundUser ? foundUser.name : "Unknown User";
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "bg-yellow-100 text-yellow-800",
      pending_secondary: "bg-orange-100 text-orange-800",
      approved: "bg-green-100 text-green-800", 
      denied: "bg-red-100 text-red-800",
      completed: "bg-blue-100 text-blue-800",
    } as const;

    const displayStatus = status === 'pending_secondary' ? 'Pending Final Approval' : 
                         status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');

    return (
      <Badge className={variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800"}>
        {displayStatus}
      </Badge>
    );
  };

  // Check if user can approve a request
  const canApprove = (request: InventoryRequest) => {
    // Handle regular pending status
    if (request.status === 'pending') {
      return (request.assignedTo === user?.id || 
              user?.role === 'stockKeeper' ||
              user?.role === 'ceo' ||
              user?.role === 'admin');
    }
    
    // Handle pending_secondary status (final approval for inventory sharing)
    if (request.status === 'pending_secondary') {
      return (request.assignedTo === user?.id || 
              user?.role === 'stockKeeper' ||
              user?.role === 'ceo' ||
              user?.role === 'admin');
    }
    
    return false;
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

          {(user?.role === 'productManager' || user?.role === 'stockKeeper' || hasPermission("canCreateRequests")) && (
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
              canApprove={canApprove}
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
              canApprove={canApprove}
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
              canApprove={canApprove}
            />
          </TabsContent>

          <TabsContent value="pending">
            <RequestTable 
              requests={allRequests.filter(r => r.status === 'pending' || r.status === 'pending_secondary')}
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
              canApprove={canApprove}
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

        {/* View Request Modal */}
        <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Request Details</DialogTitle>
              <DialogDescription>
                View detailed information about this request
              </DialogDescription>
            </DialogHeader>
            
            {currentRequest && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Title</label>
                    <p className="mt-1">{currentRequest.title}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Type</label>
                    <p className="mt-1">{currentRequest.type.replace('_', ' ').toLowerCase()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Requested By</label>
                    <p className="mt-1">{getUserName(currentRequest.requestedBy)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Assigned To</label>
                    <p className="mt-1">{currentRequest.assignedTo ? getUserName(currentRequest.assignedTo) : "Unassigned"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <div className="mt-1">{getStatusBadge(currentRequest.status)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Created</label>
                    <p className="mt-1">{formatDate(currentRequest.createdAt)}</p>
                  </div>
                </div>
                
                {/* Specialty Information */}
                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Requester Specialty</label>
                    <p className="mt-1">{getUserSpecialty(currentRequest.requestedBy) || 'N/A'}</p>
                  </div>
                  {currentRequest.assignedTo && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Assignee Specialty</label>
                      <p className="mt-1">{getUserSpecialty(currentRequest.assignedTo) || 'N/A'}</p>
                    </div>
                  )}
                </div>
                
                {currentRequest.description && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Description</label>
                    <p className="mt-1 text-sm bg-gray-50 p-3 rounded">{currentRequest.description}</p>
                  </div>
                )}
                
                {currentRequest.notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Notes</label>
                    <p className="mt-1 text-sm bg-gray-50 p-3 rounded">{currentRequest.notes}</p>
                  </div>
                )}

                {/* Requested Items Section */}
                <div>
                  <label className="text-sm font-medium text-gray-500">Requested Items</label>
                  {requestItems.length > 0 ? (
                    <div className="mt-1 border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="py-2">Item Name</TableHead>
                            <TableHead className="py-2">Requested Qty</TableHead>
                            <TableHead className="py-2">Available Qty</TableHead>
                            <TableHead className="py-2">Category</TableHead>
                            <TableHead className="py-2">Type</TableHead>
                            <TableHead className="py-2">Notes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {requestItems.map((item: any) => {
                            const stockItem = getStockItemDetails(item.stockItemId);
                            const category = stockItem ? categories.find(c => c.id === stockItem.categoryId) : null;
                            
                            return (
                              <TableRow key={item.id}>
                                <TableCell className="py-2 font-medium">
                                  {item.stockItemId ? getStockItemName(item.stockItemId) : item.itemName || "Unknown Item"}
                                </TableCell>
                                <TableCell className="py-2 font-medium text-blue-600">{item.quantity}</TableCell>
                                <TableCell className="py-2">
                                  {stockItem ? (
                                    <span className={`font-medium ${stockItem.quantity >= item.quantity ? 'text-green-600' : 'text-red-600'}`}>
                                      {stockItem.quantity}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">N/A</span>
                                  )}
                                </TableCell>
                                <TableCell className="py-2">
                                  {category ? (
                                    <span className={`px-2 py-1 rounded-full text-xs ${category.color} text-white`}>
                                      {category.name}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">N/A</span>
                                  )}
                                </TableCell>
                                <TableCell className="py-2">
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    item.stockItemId ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {item.stockItemId ? 'Stock Item' : 'Custom Item'}
                                  </span>
                                </TableCell>
                                <TableCell className="py-2 text-sm text-gray-600">{item.notes || "-"}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="mt-1 p-4 bg-gray-50 rounded-lg text-center text-gray-500">
                      No specific items requested for this request
                    </div>
                  )}
                </div>
                
                {currentRequest.fileUrl && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Attached File</label>
                    <div className="mt-1">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(currentRequest.fileUrl!, '_blank')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download File
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2 justify-end pt-4">
                  <Button 
                    variant="outline"
                    onClick={() => setShowViewModal(false)}
                  >
                    Close
                  </Button>
                  
                  {canApprove(currentRequest) && (
                    <>
                      <Button 
                        variant="default"
                        onClick={() => {
                          setShowViewModal(false);
                          setApprovalAction("approved");
                          setShowApprovalModal(true);
                        }}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      
                      <Button 
                        variant="destructive"
                        onClick={() => {
                          setShowViewModal(false);
                          setApprovalAction("denied");
                          setShowApprovalModal(true);
                        }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Deny
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
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
                  onClick={() => {
                    setShowApprovalModal(false);
                    setApprovalNotes("");
                  }}
                >
                  Cancel
                </Button>

                {/* Show different buttons based on request type and workflow stage */}
                {currentRequest?.type === 'inventory_share' && 
                 currentRequest?.status === 'pending' && 
                 approvalAction === "approved" ? (
                  // PM2 in inventory sharing workflow - show "Approve & Forward"
                  <Button
                    onClick={handleApproveAndForward}
                    variant="default"
                    disabled={approveAndForwardMutation.isPending}
                  >
                    {approveAndForwardMutation.isPending ? "Processing..." : "Approve & Forward"}
                  </Button>
                ) : currentRequest?.type === 'inventory_share' && 
                   currentRequest?.status === 'pending_secondary' && 
                   approvalAction === "approved" ? (
                  // Stock Keeper final approval for inventory sharing
                  <Button
                    onClick={handleFinalApprove}
                    variant="default"
                    disabled={finalApproveMutation.isPending}
                  >
                    {finalApproveMutation.isPending ? "Processing..." : "Final Approve"}
                  </Button>
                ) : (
                  // Regular approve/deny button for other cases
                  <Button
                    onClick={() => handleApprovalAction(approvalAction)}
                    variant={approvalAction === "approved" ? "default" : "destructive"}
                    disabled={approveMutation.isPending || denyMutation.isPending}
                  >
                    {(approveMutation.isPending || denyMutation.isPending) ? "Processing..." : 
                      (approvalAction === "approved" ? "Approve" : "Deny")
                    }
                  </Button>
                )}
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
  users: SafeUser[];
  onView: (request: InventoryRequest) => void;
  onApprove?: (request: InventoryRequest) => void;
  onDeny?: (request: InventoryRequest) => void;
  currentUser: SafeUser | null;
  canApprove: (request: InventoryRequest) => boolean;
}

function RequestTable({ requests, users, onView, onApprove, onDeny, currentUser, canApprove }: RequestTableProps) {
  const getUserName = (userId: number) => {
    const foundUser = users.find(u => u.id === userId);
    return foundUser ? foundUser.name : "Unknown User";
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "bg-yellow-100 text-yellow-800",
      pending_secondary: "bg-orange-100 text-orange-800",
      approved: "bg-green-100 text-green-800", 
      denied: "bg-red-100 text-red-800",
      completed: "bg-blue-100 text-blue-800",
    } as const;

    const displayStatus = status === 'pending_secondary' ? 'Pending Final Approval' : 
                         status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');

    return (
      <Badge className={variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800"}>
        {displayStatus}
      </Badge>
    );
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
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onView(request);
                        }}
                        title="View request details"
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