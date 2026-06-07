import { collection, query, onSnapshot, orderBy, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types';

const POSTOS_COLLECTION = 'postos';
const REVIEWS_COLLECTION = 'reviews';

export const postoService = {
  subscribeToPostos: (onUpdate: (postos: any[]) => void) => {
    return onSnapshot(query(collection(db, POSTOS_COLLECTION), orderBy('name')), (snap) => {
      onUpdate(snap.docs.map(doc => ({ id: doc.id, ...doc.data()})));
    }, (error) => {
      console.error("Error fetching postos:", error);
    });
  },

  subscribeToPostoReviews: (postoId: string, onUpdate: (reviews: any[]) => void) => {
    return onSnapshot(query(collection(db, REVIEWS_COLLECTION), where('postoId', '==', postoId)), (snap) => {
      onUpdate(snap.docs.map(doc => ({ id: doc.id, ...doc.data()})));
    }, (error) => {
      console.error("Error fetching reviews:", error);
    });
  },
  
  createReview: async (postoId: string, profile: UserProfile, category: string, bodyText: string) => {
    return await addDoc(collection(db, REVIEWS_COLLECTION), {
      postoId,
      authorId: profile.id,
      authorName: profile.name,
      authorRole: profile.role,
      category,
      body: bodyText,
      createdAt: serverTimestamp()
    });
  },

  getPostoBySlug: async (slug: string) => {
    const q = query(collection(db, POSTOS_COLLECTION), where('slug', '==', slug));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return { id: snap.docs[0].id, ...snap.docs[0].data() };
    }
    return null;
  },

  subscribeToPostoFields: (postoId: string, onUpdate: (fields: any[]) => void) => {
    const fieldsQ = query(collection(db, 'postoFields'), where('postoId', '==', postoId));
    return onSnapshot(fieldsQ, (fSnap) => {
      onUpdate(fSnap.docs.map(doc => ({ id: doc.id, ...doc.data()})));
    }, (err) => {
      console.error('Error fetching posto fields:', err);
    });
  },

  createPostoField: async (postoId: string, fieldType: string, body: string, authorId: string) => {
    return await addDoc(collection(db, 'postoFields'), {
      postoId,
      fieldType,
      body,
      authorId,
      experienceStart: new Date().getTime() - 31536000000,
      experienceEnd: new Date().getTime(),
      createdAt: serverTimestamp()
    });
  }
};
