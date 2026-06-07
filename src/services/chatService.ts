import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, getDoc, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ChatSession, ChatMessage } from '../types';

const CHATS_COLLECTION = 'chats';

export const chatService = {
  subscribeToUserChats: (userId: string, onUpdate: (chats: ChatSession[]) => void) => {
    const q = query(
      collection(db, CHATS_COLLECTION),
      where('participants', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );
    
    return onSnapshot(q, (snap) => {
      const chats = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatSession));
      onUpdate(chats);
    }, (err) => console.error('Error fetching user chats:', err));
  },

  subscribeToChatMessages: (chatId: string, onUpdate: (messages: ChatMessage[]) => void) => {
    const q = query(
      collection(db, CHATS_COLLECTION, chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    
    return onSnapshot(q, (snap) => {
      onUpdate(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage)));
    }, (err) => console.error('Error fetching chat messages:', err));
  },

  getOrCreateChat: async (userId1: string, userId2: string, name1: string, name2: string) => {
    const sortedIds = [userId1, userId2].sort();
    const chatId = `${sortedIds[0]}_${sortedIds[1]}`;
    
    const chatRef = doc(db, CHATS_COLLECTION, chatId);
    const chatSnap = await getDoc(chatRef);
    
    if (!chatSnap.exists()) {
      await setDoc(chatRef, {
        participants: sortedIds,
        participantNames: {
          [userId1]: name1,
          [userId2]: name2
        },
        updatedAt: serverTimestamp(),
      });
    }
    
    return chatId;
  },

  sendMessage: async (chatId: string, senderId: string, body: string) => {
    await addDoc(collection(db, CHATS_COLLECTION, chatId, 'messages'), {
      senderId,
      body,
      createdAt: serverTimestamp(),
      read: false
    });
    
    await updateDoc(doc(db, CHATS_COLLECTION, chatId), {
      updatedAt: serverTimestamp(),
      lastMessage: body
    });
  },

  markMessagesAsRead: async (chatId: string, userId: string) => {
    // Basic read placeholder - true robust implementation would use a batch
    // but just checking the collection simplifies it for now.
    // Assuming updating the session unreadCount or just letting the observer handle it
  }
};
