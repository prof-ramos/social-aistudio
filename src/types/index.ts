export type UserRole = 'ADMIN' | 'MEMBRO_ATIVO' | 'MEMBRO_APOSENTADO' | 'PENDENTE';

export interface AuthUser {
  uid: string;
  email: string | null;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  bio?: string;
  savedPosts?: string[];
  postos?: string[];
  createdAt?: any;
  isOnline?: boolean;
  lastOnline?: any;
}

export type PostCategory = 'POSTOS' | 'CARREIRA' | 'VIDA_EXTERIOR' | 'APOSENTADORIA' | 'GERAL';

export interface Post {
  id: string;
  title: string;
  body: string;
  category: PostCategory | string;
  authorName: string;
  authorRole: UserRole | string;
  authorId: string;
  pinned: boolean;
  createdAt: any;
  reactions?: Record<string, string[]>;
  commentCount?: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  body: string;
  createdAt: any;
  read?: boolean;
}

export interface ChatSession {
  id: string;
  participants: string[];
  participantNames?: Record<string, string>;
  updatedAt: any;
  lastMessage?: string;
  unreadCount?: Record<string, number>;
}

export interface PostComment {

  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole | string;
  body: string;
  createdAt: any;
}
