import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut, signInWithEmailAndPassword, sendPasswordResetEmail, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { UserProfile, AuthUser } from '../types';

export const authService = {
  signIn: (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  },

  sendPasswordReset: (email: string) => {
    return sendPasswordResetEmail(auth, email);
  },

  /**
   * Listen to authentication state and fetch the associated user profile.
   */
  onAuthStateChanged: (
    onUserChanged: (user: AuthUser | null, profile: UserProfile | null) => void
  ) => {
    return onAuthStateChanged(auth, async (u) => {
      if (!u) {
        onUserChanged(null, null);
        return;
      }
      
      const authUser: AuthUser = { uid: u.uid, email: u.email };

      try {
        const docSnap = await getDoc(doc(db, 'users', u.uid));
        if (docSnap.exists()) {
          const profile = { id: docSnap.id, ...docSnap.data() } as UserProfile;
          onUserChanged(authUser, profile);
        } else {
          // User exists in auth but no profile document found
          await firebaseSignOut(auth);
          onUserChanged(null, null);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        await firebaseSignOut(auth);
        onUserChanged(null, null);
      }
    });
  },

  /**
   * Sign out the current user.
   */
  signOut: () => {
    return firebaseSignOut(auth);
  }
};
