import { useEffect, useState } from 'react';
import { notificationService } from '../services/notificationService';

export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const unsub = notificationService.subscribeToUserNotifications(userId, (notifs) => {
      setNotifications(notifs);
    });
    return () => unsub();
  }, [userId]);

  const markAsRead = async (id: string) => {
    await notificationService.markAsRead(id);
  };

  const markAllAsRead = async () => {
    await notificationService.markAllAsRead(notifications);
  };

  return {
    notifications,
    markAsRead,
    markAllAsRead
  };
}
