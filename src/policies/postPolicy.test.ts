import { describe, it, expect } from 'vitest';
import { canEdit, canDelete } from './postPolicy';
import { UserProfile, Post } from '../types';

describe('postPolicy', () => {
  const adminProfile: UserProfile = {
    id: 'u1',
    name: 'Admin',
    email: 'admin@asof.space',
    role: 'ADMIN',
  };

  const memberProfile: UserProfile = {
    id: 'u2',
    name: 'Member',
    email: 'member@asof.space',
    role: 'MEMBRO_ATIVO',
  };

  const postByMember: Post = {
    id: 'p1',
    title: 'Test',
    body: 'body',
    category: 'GERAL',
    authorName: 'Member',
    authorRole: 'MEMBRO_ATIVO',
    authorId: 'u2',
    pinned: false,
    createdAt: '2026-01-01',
  };

  const postByAdmin: Post = {
    id: 'p2',
    title: 'Admin Post',
    body: 'body',
    category: 'GERAL',
    authorName: 'Admin',
    authorRole: 'ADMIN',
    authorId: 'u1',
    pinned: false,
    createdAt: '2026-01-01',
  };

  describe('canEdit', () => {
    it('returns true when profile is the post author', () => {
      expect(canEdit(memberProfile, postByMember)).toBe(true);
    });

    it('returns true when profile is ADMIN', () => {
      expect(canEdit(adminProfile, postByMember)).toBe(true);
    });

    it('returns false when profile is neither author nor ADMIN', () => {
      expect(canEdit(memberProfile, postByAdmin)).toBe(false);
    });
  });

  describe('canDelete', () => {
    it('returns true when profile is the post author', () => {
      expect(canDelete(memberProfile, postByMember)).toBe(true);
    });

    it('returns true when profile is ADMIN', () => {
      expect(canDelete(adminProfile, postByMember)).toBe(true);
    });

    it('returns false when profile is neither author nor ADMIN', () => {
      expect(canDelete(memberProfile, postByAdmin)).toBe(false);
    });
  });
});
