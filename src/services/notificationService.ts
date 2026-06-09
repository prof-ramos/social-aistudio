import { supabase } from '../lib/supabase';

interface Notification {
  id: string;
  user_id: string;
  type: string;
  actor_name: string;
  post_id?: string;
  message?: string;
  link?: string;
  read: boolean;
  created_at: string;
}

const handleError = (error: Error | null, context: string) => {
  if (error) {
    console.error(`Error ${context}:`, error);
  }
};

export const notificationService = {
  subscribeToUnreadNotifications: (userId: string, onUpdate: (count: number) => void) => {
    const fetchUnreadCount = async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) {
        handleError(error, 'fetching unread count');
        return;
      }

      onUpdate(count ?? 0);
    };

    fetchUnreadCount();

    const channel = supabase
      .channel(`unread-notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          handleError(err ?? new Error(`Channel status: ${status}`), 'subscribing to unread notifications');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  },

  subscribeToUserNotifications: (userId: string, onUpdate: (notifications: Notification[]) => void) => {
    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        handleError(error, 'fetching user notifications');
        return;
      }

      onUpdate((data ?? []) as Notification[]);
    };

    fetchNotifications();

    const channel = supabase
      .channel(`user-notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          handleError(err ?? new Error(`Channel status: ${status}`), 'subscribing to user notifications');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  },

  markAsRead: async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);

    if (error) {
      handleError(error, 'marking notification as read');
      throw error;
    }
  },

  markAllAsRead: async (notifications: Notification[]) => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .in('id', unreadIds);

    if (error) {
      handleError(error, 'marking all notifications as read');
      throw error;
    }
  },

  createNotification: async (data: any) => {
    const { data: result, error } = await supabase
      .from('notifications')
      .insert({
        user_id: data.userId || data.user_id,
        type: data.type,
        actor_name: data.actorName || data.actor_name,
        post_id: data.postId || data.post_id,
        message: data.message,
        link: data.link,
        read: false,
      })
      .select()
      .single();

    if (error) {
      handleError(error, 'creating notification');
      throw error;
    }

    return result as Notification;
  },
};
