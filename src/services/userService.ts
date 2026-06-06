import { doc, getDoc, updateDoc } from 'firebase/firestore';
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
   * Update a user profile.
   */
  updateUserProfile: async (id: string, data: Partial<UserProfile>): Promise<void> => {
    await updateDoc(doc(db, USERS_COLLECTION, id), data);
  }
};
