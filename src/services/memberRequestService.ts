import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

const MEMBER_REQUESTS_COLLECTION = 'memberRequests';

export const memberRequestService = {
  createRequest: async (data: any) => {
    return await addDoc(collection(db, MEMBER_REQUESTS_COLLECTION), {
      ...data,
      status: 'PENDING',
      createdAt: serverTimestamp()
    });
  }
};
