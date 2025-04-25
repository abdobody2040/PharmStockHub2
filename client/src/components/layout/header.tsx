import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Bell, Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getRoleName, getPlaceholderAvatar } from "@/lib/utils";
import { Link } from "wouter";

interface HeaderProps {
  onSearch?: (query: string) => void;
}

export function Header({ onSearch }: HeaderProps) {
  const { user, logoutMutation } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationCount] = useState(5); // Demo data

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  const handleLogout = async () => {
    logoutMutation.mutate();
  };

  return (
    <div className="flex items-center justify-between h-16 px-4 bg-white border-b">
      <div className="flex items-center ml-14 md:ml-0">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search..."
            className="px-10 py-2 text-sm bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary w-64"
            value={searchQuery}
            onChange={handleSearchChange}
          />
          <Search className="absolute top-2.5 left-3 w-5 h-5 text-gray-400" />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="p-1 text-gray-500 rounded-full hover:bg-gray-100 focus:outline-none"
          >
            <Bell className="w-6 h-6" />
            {notificationCount > 0 && (
              <span className="absolute top-0 right-0 flex items-center justify-center w-4 h-4 text-xs text-white bg-red-500 rounded-full">
                {notificationCount}
              </span>
            )}
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center space-x-2 focus:outline-none"
            >
              <Avatar className="w-8 h-8">
                <AvatarImage 
                  src={user?.avatar || getPlaceholderAvatar(user?.name || 'User')} 
                  alt={user?.name || 'User'} 
                />
                <AvatarFallback>{user?.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-col items-start hidden md:flex">
                <span className="text-sm font-medium text-gray-700">{user?.name}</span>
                <span className="text-xs text-gray-500">{getRoleName(user?.role || '')}</span>
              </div>
              <ChevronDown className="w-4 h-4 ml-1 text-gray-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <Link href="/settings?tab=profile">
              <DropdownMenuItem>
                Your Profile
              </DropdownMenuItem>
            </Link>
            <Link href="/settings">
              <DropdownMenuItem>
                Settings
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
