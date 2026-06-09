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
        <aside className="w-64 bg-white border-r border-border-gray text-navy hidden md:flex flex-col py-8 px-6 flex-none z-10 shadow-sm relative">
          <div className="mb-8 tour-sidebar-nav">
            <p className="text-sm uppercase font-bold tracking-widest text-slate mb-4 px-4">Navegação</p>
            <ul className="space-y-1 text-sm font-medium">
              <li>
                <Link to="/feed" className="flex items-center gap-3 bg-ice text-navy py-3 px-4 rounded-none hover:bg-border-gray/30 transition-colors">
                  <Home className="w-4 h-4" /> Início
                </Link>
              </li>
              <li>
                <Link to="/mensagens" className="flex items-center gap-3 text-slate hover:text-navy py-3 px-4 rounded-none hover:bg-ice/50 transition-colors">
                  <MessageSquare className="w-4 h-4" /> Mensagens
                </Link>
              </li>
              <li>
                <Link to="/postos" className="flex items-center gap-3 text-slate hover:text-navy py-3 px-4 rounded-none hover:bg-ice/50 transition-colors">
                  <Building2 className="w-4 h-4" /> Postos do Exterior
                </Link>
              </li>
              <li>
                <Link to="/carreira" className="flex items-center gap-3 text-slate hover:text-navy py-3 px-4 rounded-none hover:bg-ice/50 transition-colors">
                  <Briefcase className="w-4 h-4" /> Carreira e Promoção
                </Link>
              </li>
              <li>
                <Link to="/aposentadoria" className="flex items-center gap-3 text-slate hover:text-navy py-3 px-4 rounded-none hover:bg-ice/50 transition-colors">
                  <Archive className="w-4 h-4" /> Aposentadoria
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
              : 'overflow-y-auto overflow-x-clip p-4 sm:p-8 lg:p-16',
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
