import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { cn, getRoleColor, getRoleName } from "@/lib/utils";
import {
  LayoutDashboard,
  PackageOpen,
  MoveHorizontal,
  FileChartColumn,
  Users,
  Settings,
  Menu,
  FlaskRound,
  BarChart3,
  LineChart,
  FileText
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { RoleType } from "@shared/schema";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { user, hasPermission } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeRole, setActiveRole] = useState<RoleType>(user?.role as RoleType);

  // Fetch active roles from the system
  const { data: activeRoles = [], isLoading: rolesLoading } = useQuery<string[]>({
    queryKey: ["/api/active-roles"],
  });

  // Filter roles to only show active ones
  const roles: RoleType[] = activeRoles.filter(role => 
    ['ceo', 'marketer', 'salesManager', 'stockManager', 'admin', 'medicalRep', 'productManager', 'stockKeeper'].includes(role)
  ) as RoleType[];

  type MenuItem = {
    title: string;
    icon: React.ReactNode;
    href: string;
    requiredPermission: string | null;
  };

  const menuItems: MenuItem[] = [
    {
      title: "Dashboard",
      icon: <LayoutDashboard className="mr-3 h-5 w-5" />,
      href: "/",
      requiredPermission: null
    },
    {
      title: "Inventory",
      icon: <PackageOpen className="mr-3 h-5 w-5" />,
      href: "/inventory",
      requiredPermission: null
    },
    {
      title: "Stock Movement",
      icon: <MoveHorizontal className="mr-3 h-5 w-5" />,
      href: "/stock-movement",
      requiredPermission: "canMoveStock"
    },
    {
      title: "Reports",
      icon: <FileChartColumn className="mr-3 h-5 w-5" />,
      href: "/reports",
      requiredPermission: "canViewReports"
    },
    {
      title: "Analytics",
      icon: <BarChart3 className="mr-3 h-5 w-5" />,
      href: "/analytics",
      requiredPermission: "canViewReports"
    },
    {
      title: "Request Management",
      icon: <FileText className="mr-3 h-5 w-5" />,
      href: "/requests",
      requiredPermission: null // Allow for both canCreateRequests OR canManageRequests users
    },
    {
      title: "Inventory Allocation",
      icon: <Users className="mr-3 h-5 w-5" />,
      href: "/allocation",
      requiredPermission: "canManageUsers" // Only for administrators
    },
    {
      title: "User Management",
      icon: <Users className="mr-3 h-5 w-5" />,
      href: "/users",
      requiredPermission: "canManageUsers"
    },
    {
      title: "Settings",
      icon: <Settings className="mr-3 h-5 w-5" />,
      href: "/settings",
      requiredPermission: "canAccessSettings"
    }
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Used for demo/display purposes to see different role views
  const handleRoleChange = (role: RoleType) => {
    // Set active role for display
    setActiveRole(role);

    // Update filtered menu items based on role permissions
    // This is just for demo/visualization purposes
    // In a real app, this would be handled by the backend
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-primary text-white px-4 py-2 rounded-md shadow-lg';
    toast.textContent = `Switched to ${getRoleName(role)} view`;
    document.body.appendChild(toast);

    // Remove toast after 2 seconds
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 2000);

    setIsMobileMenuOpen(false);
  };

  // For demo purposes, we're filtering based on activeRole instead of the actual user role
  // This allows the CEO to "preview" what other roles would see
  const filteredMenuItems = menuItems.filter(item => {
    if (!item.requiredPermission) return true;

    // If we're in demo mode (activeRole is different from user's role)
    if (user?.role === 'ceo' && activeRole !== user.role) {
      // Simulate permissions for the selected role
      type RolePermissions = {
        [key in RoleType]: string[];
      };

      const rolePermissions: RolePermissions = {
        'ceo': ['canMoveStock', 'canViewReports', 'canManageUsers', 'canAccessSettings', 'canCreateRequests', 'canManageRequests'],
        'marketer': ['canMoveStock', 'canViewReports'],
        'salesManager': ['canMoveStock', 'canViewReports', 'canManageUsers'],
        'stockManager': ['canMoveStock', 'canAccessSettings'],
        'admin': ['canManageUsers', 'canAccessSettings', 'canCreateRequests', 'canManageRequests'],
        'medicalRep': [],
        'productManager': ['canMoveStock', 'canViewReports', 'canCreateRequests', 'canUploadFiles', 'canShareInventory'],
        'stockKeeper': ['canMoveStock', 'canViewReports', 'canManageRequests', 'canRestockInventory', 'canValidateInventory']
      };

      const permissionList = rolePermissions[activeRole as keyof typeof rolePermissions] || [];
      return permissionList.includes(item.requiredPermission as string) || false;
    }

    // Default behavior using actual permissions
    return item.requiredPermission ? hasPermission(item.requiredPermission) : true;
  });

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden fixed top-4 left-4 z-40"
        onClick={toggleMobileMenu}
      >
        <Menu className="h-6 w-6" />
      </Button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 transition-transform duration-300 transform bg-white border-r md:translate-x-0 md:static md:inset-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          className
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-center h-16 px-4 bg-white border-b">
          <Link href="/settings?tab=system" className="cursor-pointer">
            <div className="flex items-center group relative">
              <div className="absolute -inset-1 border-2 border-primary/50 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-8 h-8 flex items-center justify-center">
                {(() => {
                  const settings = JSON.parse(localStorage.getItem('system_settings') || '{}');
                  const logoUrl = settings.companyLogoUrl;

                  if (logoUrl) {
                    return (
                      <img 
                        src={logoUrl}
                        alt={settings.companyName || 'Company Logo'} 
                        className="w-8 h-8 object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = '';
                          const settings = JSON.parse(localStorage.getItem('system_settings') || '{}');
                          delete settings.companyLogoUrl;
                          localStorage.setItem('system_settings', JSON.stringify(settings));
                        }}
                      />
                    );
                  }

                  return <FlaskRound className="w-8 h-8 text-primary" />;
                })()}
              </div>
              <span className="ml-2 text-xl font-semibold text-gray-800">
                {(() => {
                  if (localStorage.getItem('system_settings')) {
                    const settings = JSON.parse(localStorage.getItem('system_settings') || '{}');
                    return settings.appName || 'PharmStock';
                  }
                  return 'PharmStock';
                })()}
              </span>
              <div className="absolute -bottom-5 left-0 right-0 text-xs text-center opacity-0 group-hover:opacity-100 transition-opacity text-primary">
                Click to update logo
              </div>
            </div>
          </Link>
        </div>

        <nav className="px-2 mt-5 space-y-1">
          {/* Role selector - demo only */}
          {user?.role === 'ceo' && (
            <>
              {roles.map((role) => (
                <button
                  key={role}
                  onClick={() => handleRoleChange(role)}
                  className={cn(
                    "flex items-center w-full px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-all",
                    activeRole === role && "bg-gray-100"
                  )}
                >
                  <div className={cn("w-3 h-3 mr-3 rounded-full", getRoleColor(role))} 
                    style={{width: '12px', height: '12px', display: 'inline-block'}}></div>
                  <span>{getRoleName(role)}</span>
                </button>
              ))}

              <div className="border-t border-gray-200 my-4"></div>
            </>
          )}

          {/* Menu items */}
          {filteredMenuItems.map((item) => (
            <div key={item.href}>
              <Link
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div
                  className={cn(
                    "flex items-center px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 cursor-pointer",
                    location === item.href && "bg-primary-50 text-primary"
                  )}
                >
                  {item.icon}
                  {item.title}
                </div>
              </Link>
            </div>
          ))}
        </nav>
      </div>

      {/* Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 md:hidden"
          onClick={toggleMobileMenu}
        ></div>
      )}
    </>
  );
}