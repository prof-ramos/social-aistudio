import { UserProfile, Post } from '../types';

export function canEdit(profile: UserProfile, post: Post): boolean {
  return post.authorId === profile.id || profile.role === 'ADMIN';
}

export function canDelete(profile: UserProfile, post: Post): boolean {
  return post.authorId === profile.id || profile.role === 'ADMIN';
}
