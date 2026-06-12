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
  createdAt?: string;
  isOnline?: boolean;
  lastOnline?: string | null;
  currentPost?: string;
  interests?: string;
  phone?: string;
  phoneIsWhatsapp?: boolean;
  showPhone?: boolean;
  showEmail?: boolean;
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
  createdAt: string;
  reactions?: Record<string, string[]>;
  commentCount?: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
  read?: boolean;
}

export interface ChatSession {
  id: string;
  participants: string[];
  participantNames?: Record<string, string>;
  updatedAt: string;
  lastMessage?: string;
  unreadCount?: number;
}

export interface PostComment {

  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole | string;
  body: string;
  createdAt: string;
}

export interface MemberRequest {
  id: string;
  name: string;
  email: string;
  cpf?: string;
  matricula?: string;
  category: UserRole;
  currentPost?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejection_reason?: string;
  created_at?: string;
}

export interface Report {
  id: string;
  type: string;
  contentId: string;
  preview?: string;
  reportedBy: string;
  reason: string;
  status: 'PENDING' | 'RESOLVED_KEPT' | 'RESOLVED_WARNED' | 'RESOLVED_REMOVED';
  notes?: string;
  createdAt?: string;
  resolvedAt?: string | null;
}

export interface MemberRequestInput {
  name: string;
  email: string;
  cpf: string;
  matricula: string;
  category: string;
  currentPost: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: string;
  actorName: string;
  postId?: string;
  message?: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface CreateNotificationParams {
  userId: string;
  type: string;
  actorName: string;
  postId?: string;
  message?: string;
  link?: string;
}

export interface Posto {
  id: string;
  name: string;
  slug: string;
  city?: string;
  country?: string;
  region?: string;
  description?: string;
  createdAt?: string;
}

export interface PostoReview {
  id: string;
  postoId: string;
  authorId: string;
  authorName: string | null;
  authorRole: string | null;
  category?: string | null;
  body: string;
  rating?: number | null;
  createdAt: string;
}

export interface PostoField {
  id: string;
  postoId: string;
  authorId: string;
  authorName: string | null;
  authorRole: string | null;
  fieldType: string;
  body: string;
  experienceStart?: number;
  experienceEnd?: number;
  createdAt: string;
}
