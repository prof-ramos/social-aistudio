import { render, screen, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';
import { authService } from '../services/authService';

vi.mock('../services/authService', () => ({
  authService: {
    onAuthStateChanged: vi.fn(() => vi.fn()),
  },
}));

const TestConsumer = () => {
  const { loading, user, profile } = useAuth();
  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'ready'}</div>
      <div data-testid="user">{user ? user.uid : 'no-user'}</div>
      <div data-testid="profile">{profile ? profile.name : 'no-profile'}</div>
    </div>
  );
};

describe('AuthProvider', () => {
  const mockedOnAuthStateChanged = vi.mocked(authService.onAuthStateChanged);

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockedOnAuthStateChanged.mockImplementation(() => vi.fn());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves loading after timeout when auth state never resolves', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await act(async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );
    });

    expect(screen.getByTestId('loading').textContent).toBe('loading');
    expect(screen.getByTestId('user').textContent).toBe('no-user');
    expect(screen.getByTestId('profile').textContent).toBe('no-profile');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(screen.getByTestId('loading').textContent).toBe('ready');
    expect(screen.getByTestId('user').textContent).toBe('no-user');
    expect(screen.getByTestId('profile').textContent).toBe('no-profile');
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('Auth state not resolved within timeout')
    );

    warnSpy.mockRestore();
  });

  it('resolves loading immediately when auth state resolves before timeout', async () => {
    mockedOnAuthStateChanged.mockImplementation((onUserChanged) => {
      onUserChanged(
        { uid: 'u1', email: 'a@b.com' },
        { id: 'u1', name: 'Test User', role: 'MEMBRO_ATIVO' } as any
      );
      return vi.fn();
    });

    await act(async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );
    });

    expect(screen.getByTestId('loading').textContent).toBe('ready');
    expect(screen.getByTestId('user').textContent).toBe('u1');
    expect(screen.getByTestId('profile').textContent).toBe('Test User');
  });
});
