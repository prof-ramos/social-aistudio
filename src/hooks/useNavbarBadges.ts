import { useEffect, useState } from 'react';
import { notificationService } from '../services/notificationService';
import { adminService } from '../services/adminService';
import type { UserProfile } from '../types';

/**
 * Live unread-notification and pending-request counts for the navbar badges.
 * Keeps the navbar component free of direct service subscriptions.
 */
export function useNavbarBadges(profile: UserProfile) {
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);

  useEffect(() => {
    const unsubNotif = notificationService.subscribeToUnreadNotifications(
      profile.id,
      (count) => setUnreadNotifications(count)
    );

    let unsubAdmin = () => {};
    if (profile.role === 'ADMIN') {
      unsubAdmin = adminService.subscribeToPendingRequests(
        (count) => setPendingRequests(count)
      );
    }

    return () => {
      unsubNotif();
      unsubAdmin();
    };
  }, [profile.id, profile.role]);

  return { unreadNotifications, pendingRequests };
}
