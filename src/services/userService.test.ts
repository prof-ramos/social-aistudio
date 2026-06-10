import { vi, describe, it, expect, beforeEach } from 'vitest';
import { userService } from './userService';

const { fromMock, storageMock, channelMock, removeChannelMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  storageMock: {
    from: vi.fn().mockReturnValue({
      list: vi.fn(),
      remove: vi.fn(),
      upload: vi.fn(),
      getPublicUrl: vi.fn(),
    }),
  },
  channelMock: vi.fn(),
  removeChannelMock: vi.fn(),
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: fromMock,
    storage: storageMock,
    channel: channelMock,
    removeChannel: removeChannelMock,
  },
}));

// --- helpers ---

const mockSingle = (result: { data: unknown; error: unknown }) => {
  const single = vi.fn().mockResolvedValue(result);
  const eq = vi.fn().mockReturnValue({ single });
  const select = vi.fn().mockReturnValue({ eq });
  fromMock.mockReturnValue({ select });
  return { single, eq, select };
};

const mockMaybeSingle = (result: { data: unknown; error: unknown }) => {
  const maybeSingle = vi.fn().mockResolvedValue(result);
  const eq2 = vi.fn().mockReturnValue({ maybeSingle });
  const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
  const select = vi.fn().mockReturnValue({ eq: eq1 });
  fromMock.mockReturnValue({ select });
  return { maybeSingle, eq2, eq1, select };
};

const mockLimit = (result: { data: unknown; error: unknown }) => {
  const limit = vi.fn().mockResolvedValue(result);
  const select = vi.fn().mockReturnValue({ limit });
  fromMock.mockReturnValue({ select });
  return { limit, select };
};

const buildRealtimeChain = () => {
  const chain: any = {
    on: vi.fn(() => chain),
    subscribe: vi.fn(() => chain),
  };
  channelMock.mockReturnValue(chain);
  return chain;
};

beforeEach(() => {
  vi.clearAllMocks();
  fromMock.mockReset();
  channelMock.mockReset();
  removeChannelMock.mockReset();
  buildRealtimeChain();
});

const userRow = (overrides?: any) => ({
  id: 'u1',
  name: 'Alice',
  email: 'alice@asof.org.br',
  role: 'MEMBRO_ATIVO',
  avatar_url: 'http://x/a.png',
  bio: 'bio',
  saved_posts: ['p1'],
  postos: ['Genebra', 'Brasilia'],
  created_at: '2026-01-01',
  is_online: true,
  last_online: '2026-06-10',
  current_post: 'Genebra',
  interests: 'carreira',
  phone: '+41 999',
  phone_is_whatsapp: true,
  show_phone: true,
  show_email: true,
  ...overrides,
});

// ===================== getUserProfile =====================

describe('userService.getUserProfile', () => {
  it('queries users_public by default and maps the row', async () => {
    mockSingle({ data: userRow(), error: null });

    const profile = await userService.getUserProfile('u1');

    expect(fromMock).toHaveBeenCalledWith('users_public');
    expect(profile).toMatchObject({
      id: 'u1',
      name: 'Alice',
      email: 'alice@asof.org.br',
      role: 'MEMBRO_ATIVO',
      avatarUrl: 'http://x/a.png',
      currentPost: 'Genebra',
      isOnline: true,
      lastOnline: '2026-06-10',
      savedPosts: ['p1'],
      postos: ['Genebra', 'Brasilia'],
    });
  });

  it('queries users table when includePrivate is true', async () => {
    mockSingle({ data: userRow(), error: null });

    await userService.getUserProfile('u1', { includePrivate: true });

    expect(fromMock).toHaveBeenCalledWith('users');
  });

  it('returns null when Supabase returns an error', async () => {
    mockSingle({ data: null, error: { message: 'not found' } });

    const profile = await userService.getUserProfile('u1');

    expect(profile).toBeNull();
  });

  it('returns null when no data is returned', async () => {
    mockSingle({ data: null, error: null });

    const profile = await userService.getUserProfile('u1');

    expect(profile).toBeNull();
  });
});

// ===================== subscribeToProfile =====================

describe('userService.subscribeToProfile', () => {
  it('fetches initial profile and subscribes to realtime changes', async () => {
    mockSingle({ data: userRow(), error: null });
    const onUpdate = vi.fn();

    const unsubscribe = userService.subscribeToProfile('u1', onUpdate);

    await vi.waitFor(() => expect(onUpdate).toHaveBeenCalled());
    expect(fromMock).toHaveBeenCalledWith('users_public');
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ id: 'u1' }));

    unsubscribe();
    expect(removeChannelMock).toHaveBeenCalled();
  });

  it('uses the private table when includePrivate is true', async () => {
    mockSingle({ data: userRow(), error: null });
    const onUpdate = vi.fn();

    userService.subscribeToProfile('u1', onUpdate, { includePrivate: true });

    await vi.waitFor(() => expect(onUpdate).toHaveBeenCalled());
    expect(fromMock).toHaveBeenCalledWith('users');
  });

  it('emits null when profile fetch fails', async () => {
    mockSingle({ data: null, error: { message: 'not found' } });
    const onUpdate = vi.fn();

    userService.subscribeToProfile('u1', onUpdate);

    await vi.waitFor(() => expect(onUpdate).toHaveBeenCalled());
    expect(onUpdate).toHaveBeenCalledWith(null);
  });
});

// ===================== updatePresence =====================

describe('userService.updatePresence', () => {
  it('updates is_online and last_online', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq });
    fromMock.mockReturnValue({ update });

    await userService.updatePresence('u1', true);

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ is_online: true, last_online: expect.any(String) })
    );
    expect(eq).toHaveBeenCalledWith('id', 'u1');
  });

  it('catches and logs errors instead of throwing', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const eq = vi.fn().mockResolvedValue({ error: new Error('network') });
    const update = vi.fn().mockReturnValue({ eq });
    fromMock.mockReturnValue({ update });

    await userService.updatePresence('u1', false);

    expect(consoleSpy).toHaveBeenCalledWith('Failed to update presence', expect.any(Error));
    consoleSpy.mockRestore();
  });
});

// ===================== updateUserProfile =====================

describe('userService.updateUserProfile', () => {
  it('maps camelCase fields to snake_case and updates the row', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq });
    fromMock.mockReturnValue({ update });

    await userService.updateUserProfile('u1', {
      currentPost: 'Paris',
      phoneIsWhatsapp: false,
      showEmail: true,
    } as any);

    expect(update).toHaveBeenCalledWith({
      current_post: 'Paris',
      phone_is_whatsapp: false,
      show_email: true,
    });
    expect(eq).toHaveBeenCalledWith('id', 'u1');
  });

  it('throws on Supabase error', async () => {
    const eq = vi.fn().mockResolvedValue({ error: new Error('rls') });
    const update = vi.fn().mockReturnValue({ eq });
    fromMock.mockReturnValue({ update });

    await expect(userService.updateUserProfile('u1', { name: 'Bob' })).rejects.toThrow('rls');
  });

  it('skips undefined fields during camelToSnake mapping', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq });
    fromMock.mockReturnValue({ update });

    await userService.updateUserProfile('u1', { name: 'Bob', bio: undefined });

    expect(update).toHaveBeenCalledWith({ name: 'Bob' });
  });
});

// ===================== getAllUsers =====================

describe('userService.getAllUsers', () => {
  it('returns up to 50 mapped users', async () => {
    const { limit, select } = mockLimit({
      data: [userRow({ id: 'u1' }), userRow({ id: 'u2', name: 'Bob' })],
      error: null,
    });

    const users = await userService.getAllUsers();

    expect(select).toHaveBeenCalledWith('*');
    expect(limit).toHaveBeenCalledWith(50);
    expect(users).toHaveLength(2);
    expect(users[1].name).toBe('Bob');
  });

  it('returns empty array on error and logs it', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockLimit({ data: null, error: new Error('db down') });

    const users = await userService.getAllUsers();

    expect(users).toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch all users', expect.any(Error));
    consoleSpy.mockRestore();
  });
});

// ===================== getUsersWithCommonPostos =====================

describe('userService.getUsersWithCommonPostos', () => {
  it('excludes the requesting user and filters by common currentPost', async () => {
    mockLimit({
      data: [
        userRow({ id: 'u1', current_post: 'Genebra' }),
        userRow({ id: 'u2', current_post: 'Genebra' }),
        userRow({ id: 'u3', current_post: 'Paris', postos: [] }),
      ],
      error: null,
    });

    const users = await userService.getUsersWithCommonPostos('u1', ['Genebra'], 10);

    expect(users).toHaveLength(1);
    expect(users[0].id).toBe('u2');
  });

  it('matches by postos array when currentPost does not overlap', async () => {
    mockLimit({
      data: [
        userRow({ id: 'u1', current_post: 'Genebra', postos: ['Genebra'] }),
        userRow({ id: 'u2', current_post: 'Paris', postos: ['Genebra', 'Paris'] }),
      ],
      error: null,
    });

    const users = await userService.getUsersWithCommonPostos('u1', ['Genebra'], 10);

    expect(users).toHaveLength(1);
    expect(users[0].id).toBe('u2');
  });

  it('returns empty array on error', async () => {
    mockLimit({ data: null, error: new Error('fail') });

    const users = await userService.getUsersWithCommonPostos('u1', ['Genebra']);

    expect(users).toEqual([]);
  });
});

// ===================== toggleSavedPost =====================

describe('userService.toggleSavedPost', () => {
  it('deletes the row when it already exists', async () => {
    mockMaybeSingle({ data: { id: 'sp1' }, error: null });
    const deleteEq2 = vi.fn().mockResolvedValue({ error: null });
    const deleteEq1 = vi.fn().mockReturnValue({ eq: deleteEq2 });
    const deleteMock = vi.fn().mockReturnValue({ eq: deleteEq1 });
    fromMock.mockImplementation((table: string) => {
      if (table === 'saved_posts') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'sp1' }, error: null }) }),
            }),
          }),
          delete: deleteMock,
          insert: vi.fn(),
        };
      }
      throw new Error(`unexpected table ${table}`);
    });

    await userService.toggleSavedPost('u1', 'p1');

    expect(deleteMock).toHaveBeenCalled();
    expect(deleteEq1).toHaveBeenCalledWith('user_id', 'u1');
    expect(deleteEq2).toHaveBeenCalledWith('post_id', 'p1');
  });

  it('inserts a row when none exists', async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    fromMock.mockImplementation((table: string) => {
      if (table === 'saved_posts') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) }),
            }),
          }),
          delete: vi.fn(),
          insert: insertMock,
        };
      }
      throw new Error(`unexpected table ${table}`);
    });

    await userService.toggleSavedPost('u1', 'p1');

    expect(insertMock).toHaveBeenCalledWith({ user_id: 'u1', post_id: 'p1' });
  });

  it('throws on insert error', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'saved_posts') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) }),
            }),
          }),
          delete: vi.fn(),
          insert: vi.fn().mockResolvedValue({ error: new Error('dup') }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    });

    await expect(userService.toggleSavedPost('u1', 'p1')).rejects.toThrow('dup');
  });
});

// ===================== uploadAvatar =====================

describe('userService.uploadAvatar', () => {
  it('removes old files, uploads the new one, and returns the public url', async () => {
    const listMock = vi.fn().mockResolvedValue({ data: [{ name: 'old.png' }], error: null });
    const removeMock = vi.fn().mockResolvedValue({ data: {}, error: null });
    const uploadMock = vi.fn().mockResolvedValue({ data: {}, error: null });
    const getPublicUrlMock = vi.fn().mockReturnValue({ data: { publicUrl: 'http://cdn/avatars/u1/123.jpg' } });

    storageMock.from.mockReturnValue({
      list: listMock,
      remove: removeMock,
      upload: uploadMock,
      getPublicUrl: getPublicUrlMock,
    });

    const file = new File(['blob'], 'photo.jpg', { type: 'image/jpeg' });
    const url = await userService.uploadAvatar('u1', file);

    expect(listMock).toHaveBeenCalledWith('u1');
    expect(removeMock).toHaveBeenCalledWith(['u1/old.png']);
    expect(uploadMock).toHaveBeenCalledWith(
      expect.stringMatching(/^u1\/\d+\.jpg$/),
      file,
      { upsert: true }
    );
    expect(getPublicUrlMock).toHaveBeenCalled();
    expect(url).toBe('http://cdn/avatars/u1/123.jpg');
  });

  it('does not remove anything when there are no existing files', async () => {
    const listMock = vi.fn().mockResolvedValue({ data: [], error: null });
    const removeMock = vi.fn();
    const uploadMock = vi.fn().mockResolvedValue({ data: {}, error: null });
    const getPublicUrlMock = vi.fn().mockReturnValue({ data: { publicUrl: 'http://cdn/avatars/u1/456.png' } });

    storageMock.from.mockReturnValue({
      list: listMock,
      remove: removeMock,
      upload: uploadMock,
      getPublicUrl: getPublicUrlMock,
    });

    const file = new File(['blob'], 'icon.png', { type: 'image/png' });
    await userService.uploadAvatar('u1', file);

    expect(removeMock).not.toHaveBeenCalled();
  });

  it('throws on upload error', async () => {
    const uploadMock = vi.fn().mockResolvedValue({ data: null, error: new Error('size exceeded') });
    const listMock = vi.fn().mockResolvedValue({ data: [], error: null });

    storageMock.from.mockReturnValue({
      list: listMock,
      remove: vi.fn(),
      upload: uploadMock,
      getPublicUrl: vi.fn(),
    });

    const file = new File(['blob'], 'big.jpg', { type: 'image/jpeg' });
    await expect(userService.uploadAvatar('u1', file)).rejects.toThrow('size exceeded');
  });
});
