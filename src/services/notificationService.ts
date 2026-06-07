import { collection, query, where, onSnapshot, updateDoc, doc, writeBatch, serverTimestamp, addDoc, limit, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

const NOTIFICATIONS_COLLECTION = 'notifications';

export const notificationService = {
  subscribeToUnreadNotifications: (userId: string, onUpdate: (count: number) => void) => {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION), 
      where('userId', '==', userId),
      where('read', '==', false)
    );
    return onSnapshot(q, (snapshot) => {
      onUpdate(snapshot.docs.length);
    }, (error) => {
      console.error('Error fetching notifications:', error);
    });
  },

  subscribeToUserNotifications: (userId: string, onUpdate: (notifications: any[]) => void) => {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    return onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      onUpdate(docs);
    }, (error) => {
      console.error('Error in notifications snapshot:', error);
    });
  },

  markAsRead: async (id: string) => {
    await updateDoc(doc(db, NOTIFICATIONS_COLLECTION, id), { read: true });
  },

  markAllAsRead: async (notifications: any[]) => {
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;
    const batch = writeBatch(db);
    unread.forEach(n => {
      batch.update(doc(db, NOTIFICATIONS_COLLECTION, n.id), { read: true });
    });
    await batch.commit();
  },

  createNotification: async (data: any) => {
    return await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
      ...data,
      read: false,
      createdAt: serverTimestamp()
    });
  }
};
