import { supabase } from '../lib/supabase';
import { UserProfile, Post } from '../types';

export interface SearchResult {
  users: UserProfile[];
  posts: Post[];
  postos: { id: string; name: string; slug: string; country?: string }[];
}

export const searchService = {
  searchAll: async (query: string): Promise<SearchResult> => {
    const escaped = query.replace(/%/g, '\\%').replace(/_/g, '\\_');
    const pattern = `%${escaped}%`;

    const [usersRes, postsRes, postosRes] = await Promise.all([
      supabase
        .from('users_public')
        .select('id, name, email, role, avatar_url, bio, created_at, is_online, last_online, current_post, interests')
        .ilike('name', pattern)
        .limit(5),
      supabase
        .from('posts')
        .select('id, title, body, category, author_id, pinned, created_at, users_public(name, role)')
        .ilike('title', pattern)
        .is('deleted_at', null)
        .limit(5),
      supabase
        .from('postos')
        .select('id, name, slug, country')
        .ilike('name', pattern)
        .limit(5),
    ]);

    const mapUser = (data: any): UserProfile => ({
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role,
      avatarUrl: data.avatar_url,
      bio: data.bio,
      createdAt: data.created_at,
      isOnline: data.is_online,
      lastOnline: data.last_online,
      currentPost: data.current_post,
      interests: data.interests,
    } as UserProfile);

    const mapPost = (row: Record<string, any>): Post => {
      const users = row.users_public;
      const user = Array.isArray(users) ? users[0] : users;
      return {
        id: row.id,
        title: row.title,
        body: row.body,
        category: row.category,
        authorId: row.author_id,
        authorName: user?.name || '',
        authorRole: user?.role || '',
        pinned: row.pinned,
        createdAt: row.created_at,
      };
    };

    return {
      users: (usersRes.data ?? []).map(mapUser),
      posts: (postsRes.data ?? []).map(mapPost),
      postos: (postosRes.data ?? []).map((p: any) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        country: p.country,
      })),
    };
  },
};