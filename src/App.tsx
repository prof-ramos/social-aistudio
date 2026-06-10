import { useEffect, useState, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { cn } from './lib/utils';
import { authService } from './services/authService';
import { systemService } from './services/systemService';
import { Navbar } from './components/layout/Navbar';
import { Login } from './pages/Login';
import { RegisterRequest } from './pages/RegisterRequest';
import ForgotPassword from './pages/ForgotPassword';
import { Feed } from './pages/Feed';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const PostDetails = lazy(() => import('./pages/PostDetails'));
const Postos = lazy(() => import('./pages/Postos').then(m => ({ default: m.Postos })));
const PostoDetails = lazy(() => import('./pages/PostoDetails').then(m => ({ default: m.PostoDetails })));
const AdminMembers = lazy(() => import('./pages/AdminMembers').then(m => ({ default: m.AdminMembers })));
const AdminModeration = lazy(() => import('./pages/AdminModeration'));
const AdminHub = lazy(() => import('./pages/AdminHub'));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const Notifications = lazy(() => import('./pages/Notifications').then(m => ({ default: m.Notifications })));
const Messages = lazy(() => import('./pages/Messages').then(m => ({ default: m.Messages })));
const CarreiraPromocao = lazy(() => import('./pages/CarreiraPromocao').then(m => ({ default: m.CarreiraPromocao })));
const Aposentadoria = lazy(() => import('./pages/Aposentadoria').then(m => ({ default: m.Aposentadoria })));
import { Home, Building2, Briefcase, Archive, MessageSquare } from 'lucide-react';
import { Tour } from './components/Tour';
import { KeyboardShortcuts, useKeyboardShortcutsOverlay } from './components/ui/KeyboardShortcuts';
import { OfflineIndicator } from './components/ui/OfflineIndicator';
import { ToastProvider } from './components/ui/Toast';
import { UserProfile } from './types';
import { usePresence } from './hooks/usePresence';

function PageLoading() {
  return (
    <div className="h-dvh min-h-screen w-full bg-ice font-sans flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
        <p className="text-sm text-slate font-medium">Carregando...</p>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-dvh min-h-screen w-full bg-ice font-sans flex flex-col overflow-hidden">
        <header className="h-16 bg-navy flex items-center justify-between px-6 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-white/10 animate-pulse rounded-none" />
            <div className="w-32 h-6 bg-white/10 animate-pulse" />
          </div>
          <div className="flex items-center gap-6">
            <div className="w-6 h-6 bg-white/10 animate-pulse rounded-none" />
            <div className="w-6 h-6 bg-white/10 animate-pulse rounded-none" />
            <div className="w-8 h-8 bg-white/10 animate-pulse rounded-full" />
          </div>
        </header>
        <main className="flex flex-1 overflow-hidden">
          <aside className="w-64 bg-white border-r border-border-gray hidden md:flex flex-col py-8 px-6 flex-none shrink-0">
            <div className="mb-8">
              <div className="w-20 h-3 bg-slate/10 animate-pulse mb-6" />
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-slate/10 animate-pulse" />
                    <div className="flex-1 h-4 bg-slate/10 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </aside>
          <section id="main-content" className="flex-1 p-4 sm:p-8 lg:p-16 overflow-y-auto bg-ice">
            <div className="mx-auto w-full max-w-[var(--page-max-width-feed)] space-y-8">
              <div className="w-48 h-8 bg-slate/10 animate-pulse" />
              <div className="w-full h-40 bg-white border border-border-gray shadow-sm animate-pulse" />
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-full h-48 bg-white border border-border-gray shadow-sm animate-pulse" />
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoading />}>
      <Routes>
        <Route path="/" element={user && profile ? <Navigate to="/feed" replace /> : <Navigate to="/login" replace />} />

        {/* Auth Routes */}
        <Route path="/login" element={user && profile ? <Navigate to="/feed" replace /> : <Login />} />
        <Route path="/solicitar-acesso" element={<RegisterRequest />} />
        <Route path="/recuperar-senha" element={<ForgotPassword />} />

        {/* App Routes */}
        <Route element={user && profile ? <Layout profile={profile} /> : <Navigate to="/login" replace />}>
          <Route path="/feed" element={<Feed profile={profile!} />} />
          <Route path="/feed/:id" element={<PostDetails profile={profile!} />} />
          <Route path="/mensagens" element={<Messages profile={profile!} />} />
          <Route path="/postos" element={<Postos />} />
          <Route path="/postos/:slug" element={<PostoDetails profile={profile!} />} />
          <Route path="/notificacoes" element={<Notifications profile={profile!} />} />
          <Route path="/perfil/:id" element={<Profile profile={profile!} />} />
          <Route path="/carreira" element={<CarreiraPromocao profile={profile!} />} />
          <Route path="/aposentadoria" element={<Aposentadoria profile={profile!} />} />
        </Route>

        {/* Admin Routes */}
        <Route element={user && profile?.role === 'ADMIN' ? <Layout profile={profile} isAdminView /> : <Navigate to="/feed" replace />}>
           <Route path="/admin" element={<AdminHub />} />
           <Route path="/admin/membros" element={<AdminMembers />} />
           <Route path="/admin/moderacao" element={<AdminModeration />} />
        </Route>

      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default function App() {
  useEffect(() => {
    systemService.checkConnection();
  }, []);

  return (
    <AuthProvider>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </AuthProvider>
  );
}

function Layout({ profile, isAdminView }: { profile: UserProfile, isAdminView?: boolean }) {
  usePresence(profile);
  const { pathname } = useLocation();
  const isMessagesRoute = pathname === '/mensagens';
  const shortcutsOverlay = useKeyboardShortcutsOverlay();

  return (
    <div className="h-dvh min-h-screen w-full bg-ice font-sans flex flex-col overflow-hidden">
      <Tour />
      <OfflineIndicator />
      <KeyboardShortcuts isOpen={shortcutsOverlay.isOpen} onClose={shortcutsOverlay.close} />
      <Navbar profile={profile} isAdminView={isAdminView} />
      <main id="main-content" className="flex flex-1 min-h-0 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-border-gray text-navy hidden md:flex flex-col py-6 px-5 flex-none z-10 shadow-sm relative overflow-y-auto">
          {/* Compact Profile Card */}
          <div className="mb-6 pb-6 border-b border-border-gray/50">
            <Link to={`/perfil/${profile.id}`} className="flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-full bg-ice border-2 border-white shadow-sm flex items-center justify-center font-bold text-navy uppercase shrink-0 overflow-hidden relative">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  profile.name.charAt(0)
                )}
                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white transition-colors duration-500 ${profile.isOnline ? 'bg-success' : 'bg-slate/30'}`} />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm text-navy group-hover:text-sky transition-colors truncate">{profile.name}</p>
                <p className="text-xs text-slate uppercase tracking-wider truncate">{profile.role === 'MEMBRO_ATIVO' ? 'Membro Ativo' : profile.role === 'MEMBRO_APOSENTADO' ? 'Membro Aposentado' : 'Administrador'}</p>
              </div>
            </Link>
          </div>

          <div className="mb-6 tour-sidebar-nav">
            <p className="text-xs uppercase font-bold tracking-widest text-slate mb-3 px-3">Navegação</p>
            <ul className="space-y-0.5 text-sm font-medium">
              <li>
                <Link to="/feed" className={cn('flex items-center gap-3 py-2.5 px-3 rounded-none transition-colors', pathname.startsWith('/feed') ? 'bg-ice text-navy' : 'text-slate hover:text-navy hover:bg-ice/50')}>
                  <Home className="w-4 h-4 shrink-0" /> Início
                </Link>
              </li>
              <li>
                <Link to="/mensagens" className={cn('flex items-center gap-3 py-2.5 px-3 rounded-none transition-colors', pathname === '/mensagens' ? 'bg-ice text-navy' : 'text-slate hover:text-navy hover:bg-ice/50')}>
                  <MessageSquare className="w-4 h-4 shrink-0" /> Mensagens
                </Link>
              </li>
              <li>
                <Link to="/postos" className={cn('flex items-center gap-3 py-2.5 px-3 rounded-none transition-colors', pathname.startsWith('/postos') ? 'bg-ice text-navy' : 'text-slate hover:text-navy hover:bg-ice/50')}>
                  <Building2 className="w-4 h-4 shrink-0" /> Postos do Exterior
                </Link>
              </li>
              <li>
                <Link to="/carreira" className={cn('flex items-center gap-3 py-2.5 px-3 rounded-none transition-colors', pathname === '/carreira' ? 'bg-ice text-navy' : 'text-slate hover:text-navy hover:bg-ice/50')}>
                  <Briefcase className="w-4 h-4 shrink-0" /> Carreira e Promoção
                </Link>
              </li>
              <li>
                <Link to="/aposentadoria" className={cn('flex items-center gap-3 py-2.5 px-3 rounded-none transition-colors', pathname === '/aposentadoria' ? 'bg-ice text-navy' : 'text-slate hover:text-navy hover:bg-ice/50')}>
                  <Archive className="w-4 h-4 shrink-0" /> Aposentadoria
                </Link>
              </li>
            </ul>
          </div>
        </aside>

        {/* Main scrollable content area */}
        <section
          className={cn(
            'flex min-h-0 flex-1 flex-col bg-ice',
            isMessagesRoute
              ? 'overflow-hidden p-0'
              : 'overflow-y-auto overflow-x-clip p-4 sm:p-6 lg:p-10',
          )}
        >
          <div
            className={cn(
              'flex w-full min-w-0 flex-col',
              isMessagesRoute ? 'min-h-0 flex-1' : 'gap-8',
            )}
          >
            <Outlet />
          </div>
        </section>
      </main>
    </div>
  );
}
