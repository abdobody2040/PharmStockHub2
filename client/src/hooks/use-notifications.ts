
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  type: 'request_created' | 'request_approved' | 'low_stock' | 'expiring_items';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Poll for notifications every 30 seconds
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/notifications');
        const newNotifications = await response.json();
        
        if (newNotifications.length > 0) {
          setNotifications(prev => [...newNotifications, ...prev]);
          
          // Show toast for urgent notifications
          newNotifications.forEach((notif: Notification) => {
            if (notif.type === 'low_stock' || notif.type === 'expiring_items') {
              toast({
                title: notif.title,
                description: notif.message,
                variant: notif.type === 'low_stock' ? 'destructive' : 'default',
              });
            }
          });
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [toast]);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  return { notifications, markAsRead };
}
