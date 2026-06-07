import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, getDoc, doc, updateDoc, increment, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Post, PostCategory, UserProfile, PostComment } from '../types';
import { userService } from './userService';
import { notificationService } from './notificationService';

const POSTS_COLLECTION = 'posts';

const notifyMentions = async (text: string, type: 'MENTION_POST' | 'MENTION_COMMENT', postId: string, actorName: string, actorId: string) => {
  try {
    const users = await userService.getAllUsers();
    // Sort users by longest name first to avoid false sub-matches
    const sortedUsers = users.sort((a, b) => b.name.length - a.name.length);
    const mentionedIds = new Set<string>();
    
    // Check if the user's name is mentioned in the text
    const lowerText = text.toLowerCase();
    for (const user of sortedUsers) {
      if (user.id !== actorId && !mentionedIds.has(user.id) && lowerText.includes(`@${user.name.toLowerCase()}`)) {
        mentionedIds.add(user.id);
        await notificationService.createNotification({
          userId: user.id,
          type,
          actorName,
          postId,
          message: `${actorName} mencionou você em um ${type === 'MENTION_POST' ? 'post' : 'comentário'}`,
          link: `/feed/${postId}`
        });
      }
    }
  } catch (err) {
    console.error('Error notifying mentions:', err);
  }
};

export const postService = {
  getPostsByIds: async (ids: string[]): Promise<Post[]> => {
    if (!ids || ids.length === 0) return [];
    
    // Process in batches of 10 to respect Firestore constraints if we used 'in'
    // But since we just do a getDoc loop here for simplicity and safety against limit:
    const promises = ids.map(id => getDoc(doc(db, POSTS_COLLECTION, id)));
    const snaps = await Promise.all(promises);
    
    return snaps
      .filter(snap => snap.exists())
      .map(snap => ({ id: snap.id, ...snap.data() } as Post));
  },

  subscribeToFeed: (onUpdate: (posts: Post[]) => void, onError: (error: Error) => void, limitCount: number = 10) => {
    const q = query(collection(db, POSTS_COLLECTION), orderBy('createdAt', 'desc'), limit(limitCount));
    
    return onSnapshot(q, (snap) => {
      const fetchedPosts = snap.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as Post[];
      
      fetchedPosts.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return 0;
      });
      
      onUpdate(fetchedPosts);
    }, onError);
  },

  createPost: async (title: string, bodyHTML: string, category: PostCategory | string, profile: UserProfile) => {
    const docRef = await addDoc(collection(db, POSTS_COLLECTION), {
      title,
      body: bodyHTML,
      category,
      authorName: profile.name,
      authorRole: profile.role,
      authorId: profile.id,
      pinned: false,
      createdAt: serverTimestamp()
    });
    
    // Notify mentioned users asynchronously (don't block the post creation return)
    notifyMentions(bodyHTML, 'MENTION_POST', docRef.id, profile.name, profile.id);
    
    return docRef;
  },

  getPost: async (id: string): Promise<Post | null> => {
    const docSnap = await getDoc(doc(db, POSTS_COLLECTION, id));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Post;
    }
    return null;
  },

  subscribeToPost: (id: string, onUpdate: (post: Post | null) => void) => {
    return onSnapshot(doc(db, POSTS_COLLECTION, id), (docSnap) => {
      if (docSnap.exists()) {
        onUpdate({ id: docSnap.id, ...docSnap.data() } as Post);
      } else {
        onUpdate(null);
      }
    }, (err) => console.error('Error fetching post:', err));
  },

  subscribeToComments: (postId: string, onUpdate: (comments: PostComment[]) => void) => {
    const q = query(collection(db, POSTS_COLLECTION, postId, 'comments'), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snap) => {
      onUpdate(snap.docs.map(doc => ({ id: doc.id, postId, ...doc.data() } as PostComment)));
    }, (err) => console.error('Error fetching comments:', err));
  },

  createComment: async (postId: string, body: string, profile: UserProfile) => {
    // Increment comment count along with creating the comment
    const postRef = doc(db, POSTS_COLLECTION, postId);
    await updateDoc(postRef, {
      commentCount: increment(1)
    });
    
    const commentRef = await addDoc(collection(db, POSTS_COLLECTION, postId, 'comments'), {
      body,
      authorName: profile.name,
      authorRole: profile.role,
      authorId: profile.id,
      createdAt: serverTimestamp()
    });
    
    // Notify mentions
    notifyMentions(body, 'MENTION_COMMENT', postId, profile.name, profile.id);
    
    return commentRef;
  },

  toggleReaction: async (postId: string, emoji: string, userId: string) => {
    const postRef = doc(db, POSTS_COLLECTION, postId);
    const postSnap = await getDoc(postRef);
    if (!postSnap.exists()) return;
    const postData = postSnap.data() as Post;
    const reactions = postData.reactions || {};
    const userReacts = reactions[emoji] || [];
    
    if (userReacts.includes(userId)) {
      reactions[emoji] = userReacts.filter(id => id !== userId);
    } else {
      reactions[emoji] = [...userReacts, userId];
    }
    
    // Clean up empty emoji lists
    if (reactions[emoji].length === 0) {
      delete reactions[emoji];
    }
    
    await updateDoc(postRef, { reactions });
  }
};
