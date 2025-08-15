import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: Omit<User, 'password'> | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<Omit<User, 'password'>, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<Omit<User, 'password'>, Error, InsertUser>;
  hasPermission: (permission: string) => boolean;
};

type LoginData = {
  username: string;
  password: string;
};

const ROLE_PERMISSIONS = {
  ceo: {
    canViewAll: true,
    canAddItems: true,
    canEditItems: true,
    canRemoveItems: true,
    canMoveStock: true,
    canManageUsers: true,
    canViewReports: true,
    canAccessSettings: true,
    canCreateRequests: true
  },
  marketer: {
    canViewAll: false,
    canAddItems: false,
    canEditItems: false,
    canRemoveItems: false,
    canMoveStock: false,
    canManageUsers: false,
    canViewReports: true,
    canAccessSettings: false,
    canCreateRequests: false
  },
  salesManager: {
    canViewAll: false,
    canAddItems: true,
    canEditItems: true,
    canRemoveItems: true,
    canMoveStock: true,
    canManageUsers: false,
    canViewReports: false,
    canAccessSettings: false,
    canCreateRequests: false
  },
  stockManager: {
    canViewAll: false,
    canAddItems: true,
    canEditItems: true,
    canRemoveItems: true,
    canMoveStock: false,
    canManageUsers: false,
    canViewReports: false,
    canAccessSettings: true,
    canCreateRequests: false
  },
  admin: {
    canViewAll: false,
    canAddItems: true,
    canEditItems: true,
    canRemoveItems: true,
    canMoveStock: false,
    canManageUsers: true,
    canViewReports: true,
    canAccessSettings: true,
    canCreateRequests: true
  },
  medicalRep: {
    canViewAll: false,
    canAddItems: false,
    canEditItems: false,
    canRemoveItems: false,
    canMoveStock: false,
    canManageUsers: false,
    canViewReports: false,
    canAccessSettings: false,
    canCreateRequests: false
  },
  productManager: {
    canViewAll: false,
    canAddItems: false,
    canEditItems: false,
    canRemoveItems: false,
    canMoveStock: false,
    canManageUsers: false,
    canViewReports: false,
    canAccessSettings: false,
    canCreateRequests: true
  },
  stockKeeper: {
    canViewAll: true,
    canAddItems: true,
    canEditItems: true,
    canRemoveItems: true,
    canMoveStock: true,
    canManageUsers: false,
    canViewReports: true,
    canAccessSettings: false,
    canCreateRequests: true
  }
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<Omit<User, 'password'> | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (userData: Omit<User, 'password'>) => {
      queryClient.setQueryData(["/api/user"], userData);
      toast({
        title: "Login successful",
        description: `Welcome back, ${userData.name}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", userData);
      return await res.json();
    },
    onSuccess: (userData: Omit<User, 'password'>) => {
      queryClient.setQueryData(["/api/user"], userData);
      toast({
        title: "Registration successful",
        description: `Welcome, ${userData.name}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      queryClient.invalidateQueries();
      toast({
        title: "Logout successful",
        description: "You have been logged out.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const hasPermission = (permission: string) => {
    if (!user) return false;
    return ROLE_PERMISSIONS[user.role as keyof typeof ROLE_PERMISSIONS]?.[permission as keyof typeof ROLE_PERMISSIONS.ceo] || false;
  };

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}