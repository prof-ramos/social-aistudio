import { Outlet, Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Navbar } from '../components/layout/Navbar';
import { Tour } from '../components/Tour';
import { KeyboardShortcuts, useKeyboardShortcutsOverlay } from '../components/ui/KeyboardShortcuts';
import { OfflineIndicator } from '../components/ui/OfflineIndicator';
import { UserProfile } from '../types';
import { usePresence } from '../hooks/usePresence';
import { Home, Building2, Briefcase, Archive, MessageSquare } from 'lucide-react';

export function AppLayout({ profile, isAdminView }: { profile: UserProfile; isAdminView?: boolean }) {
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
