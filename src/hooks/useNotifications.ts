import { useEffect, useState } from 'react';
import { notificationService } from '../services/notificationService';
import { AppNotification } from '../types';

export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

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
