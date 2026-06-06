import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

const REPORTS_COLLECTION = 'reports';

export const reportService = {
  createReport: async (type: string, contentId: string, preview: string, reporterId: string, reason: string) => {
    return await addDoc(collection(db, REPORTS_COLLECTION), {
      type,
      contentId,
      preview: preview.substring(0, 100),
      reportedBy: reporterId,
      reason,
      status: 'PENDING',
      createdAt: serverTimestamp()
    });
  }
};
