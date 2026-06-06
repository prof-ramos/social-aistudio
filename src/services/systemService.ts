import { doc, getDocFromServer } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const systemService = {
  checkConnection: () => {
    getDocFromServer(doc(db, 'test', 'connection')).catch(e => {
      if (e instanceof Error && e.message.includes('the client is offline')) {
        console.error("Please check your Firebase configuration.");
      }
    });
  }
};
