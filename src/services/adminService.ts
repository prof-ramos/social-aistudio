import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const MEMBER_REQUESTS_COLLECTION = 'memberRequests';
const REPORTS_COLLECTION = 'reports';
const USERS_COLLECTION = 'users';

export const adminService = {
  subscribeToPendingRequests: (onUpdate: (count: number) => void) => {
    const q = query(
      collection(db, MEMBER_REQUESTS_COLLECTION),
      where('status', '==', 'PENDING')
    );
    return onSnapshot(q, (snapshot) => {
      onUpdate(snapshot.docs.length);
    }, (error) => {
      console.error('Error fetching admin requests:', error);
    });
  },

  subscribeToAllRequests: (onUpdate: (requests: any[]) => void) => {
    const q = query(collection(db, MEMBER_REQUESTS_COLLECTION), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      onUpdate(snap.docs.map(doc => ({ id: doc.id, ...doc.data()})));
    });
  },

  updateRequestStatus: async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
    await updateDoc(doc(db, MEMBER_REQUESTS_COLLECTION, requestId), { status });
  },

  rejectRequestWithReason: async (requestId: string, reason: string) => {
    await updateDoc(doc(db, MEMBER_REQUESTS_COLLECTION, requestId), {
      status: 'REJECTED',
      rejectionReason: reason
    });
  },

  createUserFromRequest: async (uid: string, requestData: any) => {
    await setDoc(doc(db, USERS_COLLECTION, uid), {
      name: requestData.name,
      email: requestData.email,
      role: requestData.category,
      cpf: requestData.cpf,
      matricula: requestData.matricula,
      currentPost: requestData.currentPost
    });
  },

  subscribeToReports: (onUpdate: (reports: any[]) => void) => {
    const q = query(collection(db, REPORTS_COLLECTION), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      onUpdate(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  },

  updateReportStatus: async (reportId: string, status: string) => {
    await updateDoc(doc(db, REPORTS_COLLECTION, reportId), { status });
  }
};
