import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/authService';
import { UserProfile, AuthUser } from '../types';

interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfile | null;
  loading: boolean;
}

const DEV_BYPASS_KEY = 'dev_bypass_auth';

const MOCK_ADMIN: { user: AuthUser; profile: UserProfile } = {
  user: {
    uid: 'dev-admin-001',
    email: 'dev@asof.local',
  },
  profile: {
    id: 'dev-admin-001',
    name: 'Dev Admin',
    email: 'dev@asof.local',
    role: 'ADMIN',
    avatarUrl: null,
    bio: 'Bypass de desenvolvimento',
    isOnline: true,
    createdAt: new Date().toISOString(),
  },
};

export function enableDevBypass() {
  localStorage.setItem(DEV_BYPASS_KEY, '1');
}

export function disableDevBypass() {
  localStorage.removeItem(DEV_BYPASS_KEY);
}

export function isDevBypassEnabled() {
  return localStorage.getItem(DEV_BYPASS_KEY) === '1';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDevBypassEnabled()) {
      setUser(MOCK_ADMIN.user);
      setProfile(MOCK_ADMIN.profile);
      setLoading(false);
      return;
    }

    const unsubscribe = authService.onAuthStateChanged((u, p) => {
      setUser(u);
      setProfile(p);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
