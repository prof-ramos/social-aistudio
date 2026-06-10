import { vi, describe, it, expect, beforeEach } from 'vitest';
import { authService } from './authService';

const { authMocks, fromMock } = vi.hoisted(() => ({
  authMocks: {
    signInWithPassword: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    onAuthStateChange: vi.fn(),
    signOut: vi.fn(),
  },
  fromMock: vi.fn(),
}));

vi.mock('../lib/supabase', () => ({
  supabase: { auth: authMocks, from: fromMock },
}));

// Helper: build the `from('users').select('*').eq('id', x).single()` chain.
const mockProfileFetch = (result: { data: unknown; error: unknown }) => {
  const single = vi.fn().mockResolvedValue(result);
  fromMock.mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({ single }),
    }),
  });
  return single;
};

// Helper: register onAuthStateChange and capture the handler the service passes in.
const captureAuthHandler = () => {
  let handler: (event: string, session: unknown) => Promise<void> | void = () => {};
  const unsubscribe = vi.fn();
  authMocks.onAuthStateChange.mockImplementation((cb: any) => {
    handler = cb;
    return { data: { subscription: { unsubscribe } } };
  });
  return { get: () => handler, unsubscribe };
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('authService.signIn', () => {
  it('returns data and forwards credentials on success', async () => {
    const data = { user: { id: 'u1' }, session: { access_token: 't' } };
    authMocks.signInWithPassword.mockResolvedValue({ data, error: null });

    const result = await authService.signIn('a@b.com', 'secret');

    expect(authMocks.signInWithPassword).toHaveBeenCalledWith({ email: 'a@b.com', password: 'secret' });
    expect(result).toBe(data);
  });

  it('throws when Supabase returns an error', async () => {
    authMocks.signInWithPassword.mockResolvedValue({ data: null, error: new Error('invalid login') });
    await expect(authService.signIn('a@b.com', 'wrong')).rejects.toThrow('invalid login');
  });
});

describe('authService.sendPasswordReset', () => {
  it('calls resetPasswordForEmail with the email', async () => {
    authMocks.resetPasswordForEmail.mockResolvedValue({ data: {}, error: null });
    await authService.sendPasswordReset('a@b.com');
    expect(authMocks.resetPasswordForEmail).toHaveBeenCalledWith('a@b.com');
  });

  it('throws when reset fails', async () => {
    authMocks.resetPasswordForEmail.mockResolvedValue({ data: null, error: new Error('not found') });
    await expect(authService.sendPasswordReset('x@y.com')).rejects.toThrow('not found');
  });
});

describe('authService.onAuthStateChanged', () => {
  it('emits (null, null) when there is no session', async () => {
    const cap = captureAuthHandler();
    const onUserChanged = vi.fn();

    authService.onAuthStateChanged(onUserChanged);
    await cap.get()('SIGNED_OUT', null);

    expect(onUserChanged).toHaveBeenCalledWith(null, null);
  });

  it('signs out and emits (null, null) when the profile is missing', async () => {
    const cap = captureAuthHandler();
    mockProfileFetch({ data: null, error: { message: 'no row' } });
    authMocks.signOut.mockResolvedValue({ error: null });
    const onUserChanged = vi.fn();

    authService.onAuthStateChanged(onUserChanged);
    await cap.get()('SIGNED_IN', { user: { id: 'u1', email: 'a@b.com' } });

    expect(authMocks.signOut).toHaveBeenCalled();
    expect(onUserChanged).toHaveBeenCalledWith(null, null);
  });

  it('emits the mapped profile when session + profile are present', async () => {
    const cap = captureAuthHandler();
    mockProfileFetch({
      data: {
        id: 'u1',
        name: 'João',
        email: 'joao@asof.org.br',
        role: 'MEMBRO_ATIVO',
        avatar_url: 'http://x/a.png',
        bio: 'bio',
        current_post: 'Genebra',
        interests: ['carreira'],
        is_online: true,
        last_online: '2026-06-10',
        created_at: '2026-01-01',
      },
      error: null,
    });
    const onUserChanged = vi.fn();

    authService.onAuthStateChanged(onUserChanged);
    await cap.get()('SIGNED_IN', { user: { id: 'u1', email: 'joao@asof.org.br' } });

    expect(onUserChanged).toHaveBeenCalledTimes(1);
    const [authUser, profile] = onUserChanged.mock.calls[0];
    expect(authUser).toEqual({ uid: 'u1', email: 'joao@asof.org.br' });
    expect(profile).toMatchObject({
      id: 'u1',
      name: 'João',
      email: 'joao@asof.org.br',
      role: 'MEMBRO_ATIVO',
      avatarUrl: 'http://x/a.png',
      currentPost: 'Genebra',
      isOnline: true,
    });
  });

  it('returns an unsubscribe function that tears down the subscription', () => {
    const cap = captureAuthHandler();
    const unsub = authService.onAuthStateChanged(vi.fn());
    unsub();
    expect(cap.unsubscribe).toHaveBeenCalled();
  });
});
