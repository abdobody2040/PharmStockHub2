import { useState } from "react";
import { Link, useLocation } from "wouter";
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
  LineChart
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

  const roles: RoleType[] = [
    'ceo', 'marketer', 'salesManager', 'stockManager', 'admin', 'medicalRep'
  ];

  const menuItems = [
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

  // Only used for demo/display purposes to see different role views
  const handleRoleChange = (role: RoleType) => {
    setActiveRole(role);
    setIsMobileMenuOpen(false);
  };

  const filteredMenuItems = menuItems.filter(item => 
    !item.requiredPermission || hasPermission(item.requiredPermission)
  );

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
          <div className="flex items-center">
            <FlaskRound className="w-8 h-8 text-primary" />
            <span className="ml-2 text-xl font-semibold text-gray-800">PharmStock</span>
          </div>
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
                  <div className={cn("w-3 h-3 mr-3 rounded-full", getRoleColor(role))}></div>
                  <span>{getRoleName(role)}</span>
                </button>
              ))}
              
              <div className="border-t border-gray-200 my-4"></div>
            </>
          )}

          {/* Menu items */}
          {filteredMenuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <a
                className={cn(
                  "flex items-center px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 cursor-pointer",
                  location === item.href && "bg-primary-50 text-primary"
                )}
              >
                {item.icon}
                {item.title}
              </a>
            </Link>
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
