import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Bell, Search, ChevronDown, ExternalLink, Package, AlertTriangle, Info } from "lucide-react";
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
import { getRoleName, getPlaceholderAvatar, formatDate } from "@/lib/utils";
import { Link } from "wouter";
import { ScrollArea } from "@/components/ui/scroll-area";

interface HeaderProps {
  onSearch?: (query: string) => void;
}

// Mock notification data structure - in a real app, this would come from the API
interface Notification {
  id: number;
  title: string;
  message: string;
  date: Date;
  read: boolean;
  type: 'info' | 'warning' | 'alert' | 'stock';
  link?: string;
}

export function Header({ onSearch }: HeaderProps) {
  const { user, logoutMutation } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      title: "Low Stock Alert",
      message: "Promotional brochures are running low (5 items remaining)",
      date: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      read: false,
      type: 'warning',
      link: '/inventory'
    },
    {
      id: 2,
      title: "Expiring Items",
      message: "3 items are expiring within the next week",
      date: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      read: false,
      type: 'alert',
      link: '/stock-movement'
    }
  ]);
  
  // Calculate unread notification count
  const notificationCount = notifications.filter(n => !n.read).length;

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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="p-1 text-gray-500 rounded-full hover:bg-gray-100 focus:outline-none"
            >
              <Bell className="w-6 h-6" />
              {notificationCount > 0 && (
                <span className="absolute -top-2 -right-2 flex items-center justify-center w-4 h-4 text-xs text-white bg-red-500 rounded-full">
                  {notificationCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between p-2 border-b">
              <div className="text-sm font-medium">Notifications</div>
              {notificationCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    // Mark all as read
                    setNotifications(prev => 
                      prev.map(n => ({ ...n, read: true }))
                    );
                  }}
                >
                  Mark all as read
                </Button>
              )}
            </div>
            
            <ScrollArea className="h-[300px]">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-4 text-center">
                  <Info className="text-gray-400 mb-2 h-10 w-10" />
                  <div className="text-sm text-gray-500">No notifications</div>
                </div>
              ) : (
                notifications.map(notification => {
                  // Select icon based on notification type
                  let Icon = Info;
                  let bgColor = 'bg-blue-50';
                  let iconColor = 'text-blue-500';
                  
                  switch (notification.type) {
                    case 'warning':
                      Icon = AlertTriangle;
                      bgColor = 'bg-yellow-50';
                      iconColor = 'text-yellow-500';
                      break;
                    case 'alert':
                      Icon = AlertTriangle;
                      bgColor = 'bg-red-50';
                      iconColor = 'text-red-500';
                      break;
                    case 'stock':
                      Icon = Package;
                      bgColor = 'bg-green-50';
                      iconColor = 'text-green-500';
                      break;
                  }
                  
                  return (
                    <div 
                      key={notification.id}
                      className={`flex items-start p-3 border-b hover:bg-gray-50 cursor-pointer ${notification.read ? '' : 'bg-blue-50'}`}
                      onClick={() => {
                        // Mark as read
                        setNotifications(prev => 
                          prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
                        );
                        
                        // Redirect if link exists
                        if (notification.link) {
                          window.location.href = notification.link;
                        }
                      }}
                    >
                      <div className={`flex-shrink-0 rounded-full p-2 mr-3 ${bgColor}`}>
                        <Icon className={`h-4 w-4 ${iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{notification.title}</div>
                        <div className="text-xs text-gray-500 mt-1">{notification.message}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {formatDate(notification.date)}
                        </div>
                      </div>
                      {notification.link && (
                        <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0 self-center ml-2" />
                      )}
                    </div>
                  );
                })
              )}
            </ScrollArea>
            
            <div className="p-2 text-center border-t">
              <Link href="/settings?tab=notifications">
                <Button variant="link" size="sm" className="text-xs">
                  View all notifications
                </Button>
              </Link>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

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
