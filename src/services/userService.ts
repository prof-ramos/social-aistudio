import { doc, getDoc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types';

const USERS_COLLECTION = 'users';

export const userService = {
  /**
   * Fetch a user profile by ID.
   */
  getUserProfile: async (id: string): Promise<UserProfile | null> => {
    const docSnap = await getDoc(doc(db, USERS_COLLECTION, id));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as UserProfile;
    }
    return null;
  },

  /**
   * Listen to real-time updates for a user profile.
   */
  subscribeToProfile: (id: string, onUpdate: (profile: UserProfile | null) => void) => {
    return onSnapshot(doc(db, USERS_COLLECTION, id), (docSnap) => {
      if (docSnap.exists()) {
        onUpdate({ id: docSnap.id, ...docSnap.data() } as UserProfile);
      } else {
        onUpdate(null);
      }
    }, (error) => {
      console.error('Error fetching real-time profile data:', error);
      onUpdate(null);
    });
  },

  /**
   * Update presence status (online/offline).
   */
  updatePresence: async (id: string, isOnline: boolean): Promise<void> => {
    try {
      await updateDoc(doc(db, USERS_COLLECTION, id), { 
        isOnline,
        lastOnline: serverTimestamp()
      });
    } catch (e) {
      console.error('Failed to update presence', e);
    }
  },

  /**
   * Update a user profile.
   */
  updateUserProfile: async (id: string, data: Partial<UserProfile>): Promise<void> => {
    await updateDoc(doc(db, USERS_COLLECTION, id), data);
  },

  /**
   * Toggle saved post in user profile.
   */
  toggleSavedPost: async (userId: string, postId: string): Promise<void> => {
    const docRef = doc(db, USERS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return;
    
    const profile = docSnap.data() as UserProfile;
    const savedPosts = profile.savedPosts || [];
    
    let updatedSavedPosts;
    if (savedPosts.includes(postId)) {
      updatedSavedPosts = savedPosts.filter(id => id !== postId);
    } else {
      updatedSavedPosts = [...savedPosts, postId];
    }
    
    await updateDoc(docRef, { savedPosts: updatedSavedPosts });
  }
};
