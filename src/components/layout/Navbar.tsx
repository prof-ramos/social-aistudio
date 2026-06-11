import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, User, LogOut, Bell, Shield, Search, MessageSquare, Compass, Home, Moon, Sun } from 'lucide-react';
import { authService } from '../../services/authService';
import { UserProfile } from '../../types';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { notificationService } from '../../services/notificationService';
import { adminService } from '../../services/adminService';
import { cn } from '../../lib/utils';
import { useDarkMode } from '../../hooks/useDarkMode';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useGlobalSearch } from '../../hooks/useGlobalSearch';
import { NavbarBrand } from '../brand/NavbarBrand';
import { BrandLockup } from '../brand/BrandLockup';
import { GlobalSearchDropdown } from './GlobalSearchDropdown';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';

export function Navbar({ profile, isAdminView }: { profile: UserProfile, isAdminView?: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const { query, setQuery, results, isSearching, clearQuery } = useGlobalSearch();

  const dropdownRef = useRef<HTMLDivElement>(null);
  const adminDropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubNotif = notificationService.subscribeToUnreadNotifications(
      profile.id,
      (count) => setUnreadNotifications(count)
    );

    let unsubAdmin = () => {};
    if (profile.role === 'ADMIN') {
      unsubAdmin = adminService.subscribeToPendingRequests(
        (count) => setPendingRequests(count)
      );
    }

    return () => {
      unsubNotif();
      unsubAdmin();
    };
  }, [profile.id, profile.role]);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (adminDropdownRef.current && !adminDropdownRef.current.contains(event.target as Node)) {
        setAdminDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        clearQuery();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [clearQuery]);

  // Clear search on navigation
  useEffect(() => {
    clearQuery();
  }, [location.pathname, clearQuery]);

  // Keyboard shortcut: / focuses search
  useEffect(() => {
    function handleSlash(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable;
      if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey && !isInput) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    document.addEventListener('keydown', handleSlash);
    return () => document.removeEventListener('keydown', handleSlash);
  }, []);

  // Escape key handling
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        if (query) {
          clearQuery();
          return;
        }
        setDropdownOpen(false);
        setAdminDropdownOpen(false);
        setMobileMenuOpen(false);
        if (showLogoutDialog) {
          setShowLogoutDialog(false);
        }
      }
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showLogoutDialog, query, clearQuery]);

  useFocusTrap(mobileMenuRef, mobileMenuOpen);

  // Body scroll lock for mobile menu
  const savedScrollY = useRef(0);
  useEffect(() => {
    if (mobileMenuOpen) {
      savedScrollY.current = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${savedScrollY.current}px`;
    } else {
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      window.scrollTo(0, savedScrollY.current);
    }
    return () => {
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      if (mobileMenuOpen) {
        window.scrollTo(0, savedScrollY.current);
      }
    };
  }, [mobileMenuOpen]);

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
    setDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  const performLogout = async () => {
    await authService.signOut();
    navigate('/login');
  };

  return (
    <>
      {/* Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:bg-navy focus:text-white focus:px-4 focus:py-2 focus:rounded-none"
      >
        Pular para conteúdo principal
      </a>

      <nav
        className="sticky top-0 z-50 flex h-16 flex-none items-center justify-between border-b border-border-gray bg-white px-6 font-sans shadow-[0_1px_0_color-mix(in_srgb,var(--app-institutional-gold)_55%,transparent)] transition-[background-color,box-shadow,color] duration-200 md:bg-white/92 md:backdrop-blur-md md:px-8 contain-[layout_paint]"
        aria-label="Navegação principal"
      >
        <div className="flex min-w-0 flex-1 items-center gap-8 md:flex-none md:w-auto xl:gap-12">
          <NavbarBrand isDarkMode={isDarkMode} />
        </div>

        {/* Global Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-6">
          <div ref={searchRef} className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <input
              type="text"
              ref={searchInputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="block w-full pl-10 pr-4 py-2 bg-ice/50 border border-transparent rounded-none text-base placeholder-slate/80 focus:outline-none focus:ring-2 focus:ring-navy focus:border-navy focus:bg-white transition-all text-navy"
              placeholder="Buscar membros, posts ou postos..."
              aria-label="Buscar membros, posts ou postos"
            />
            {query.length >= 2 && (
              <GlobalSearchDropdown
                query={query}
                results={results}
                isSearching={isSearching}
                onClose={() => clearQuery()}
                inputRef={searchInputRef}
              />
            )}
          </div>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-2 lg:gap-4">
          <button
            onClick={toggleDarkMode}
            className="relative p-2 transition-colors rounded-none flex items-center h-16 border-b-2 border-transparent text-slate hover:text-navy hover:bg-ice/50"
            title={isDarkMode ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
            aria-label={isDarkMode ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
          >
            {isDarkMode ? <Sun className="w-5 h-5" strokeWidth={1.5} aria-hidden="true" /> : <Moon className="w-5 h-5" strokeWidth={1.5} aria-hidden="true" />}
          </button>

          <Link
            to="/notificacoes"
            className={cn(
              'relative p-2 transition-colors rounded-none flex items-center h-16 border-b-2',
              location.pathname.startsWith('/notificacoes') ? 'border-navy text-navy font-bold' : 'border-transparent text-slate hover:text-navy hover:bg-ice/50'
            )}
            title="Notificações"
            aria-label={unreadNotifications > 0 ? `Notificações, ${unreadNotifications} não lidas` : 'Notificações'}
          >
            <Bell className="w-5 h-5" strokeWidth={location.pathname.startsWith('/notificacoes') ? 2 : 1.5} aria-hidden="true" />
            {unreadNotifications > 0 && (
              <span className="absolute top-3 right-2 w-2 h-2 bg-danger rounded-full animate-pulse border border-white" aria-hidden="true"></span>
            )}
          </Link>

          {profile.role === 'ADMIN' && (
             <div className="relative flex items-center h-16" ref={adminDropdownRef}>
               <button
                 onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}
                 className={cn(
                   'relative p-2 transition-colors rounded-none flex items-center h-16 border-b-2',
                   location.pathname.startsWith('/admin') ? 'border-navy text-navy font-bold' : 'border-transparent text-slate hover:text-navy hover:bg-ice/50'
                 )}
                 title="Painel Admin"
                 aria-expanded={adminDropdownOpen}
                 aria-haspopup="true"
                 aria-label="Painel Admin"
               >
                 <Shield className="w-5 h-5" strokeWidth={location.pathname.startsWith('/admin') ? 2 : 1.5} aria-hidden="true" />
                 {pendingRequests > 0 && (
                   <span className="absolute top-3 right-2 w-2 h-2 bg-sky rounded-full animate-pulse border border-white" aria-hidden="true"></span>
                 )}
               </button>
               {adminDropdownOpen && (
                 <div className="absolute right-[max(0px,env(safe-area-inset-right))] top-full mt-0 w-56 bg-white text-navy shadow-md border border-border-gray z-50">
                    <Link to="/admin/membros" className="block px-4 py-3 text-base hover:bg-ice transition-colors border-b border-border-gray" onClick={() => setAdminDropdownOpen(false)}>Configurações & Membros</Link>
                    <Link to="/admin/moderacao" className="block px-4 py-3 text-base hover:bg-ice transition-colors" onClick={() => setAdminDropdownOpen(false)}>Central de Moderação</Link>
                 </div>
               )}
             </div>
          )}

          <div className="h-6 w-px bg-border-gray mx-1 lg:mx-2" aria-hidden="true"></div>

          <div className="relative flex items-center h-16" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 hover:bg-ice/50 p-2 rounded-none transition-colors group focus:outline-none focus:ring-2 focus:ring-navy"
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
              aria-label="Menu do perfil"
            >
              <div className="text-right hidden sm:block">
                <p className="text-base font-bold text-navy group-hover:text-sky transition-colors">{profile.name.split(' ')[0]}</p>
                <p className="text-sm text-slate uppercase tracking-wider">{profile.role === 'MEMBRO_ATIVO' ? 'Membro' : profile.role === 'MEMBRO_APOSENTADO' ? 'Aposentado' : 'Admin'}</p>
              </div>
              <div className="w-11 h-11 bg-ice border border-border-gray flex items-center justify-center text-navy font-bold uppercase overflow-hidden">
                {profile.avatarUrl ? <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" /> : profile.name.charAt(0)}
              </div>
            </button>

            {dropdownOpen && (
              <div className="absolute right-[max(0px,env(safe-area-inset-right))] top-full mt-0 w-48 bg-white text-slate shadow-md border border-border-gray z-50">
                <div className="px-4 py-3 border-b border-border-gray bg-ice/30">
                  <p className="text-base font-bold text-navy">{profile.name}</p>
                  <p className="text-sm text-slate truncate">{profile.email}</p>
                </div>
                <Link to={`/perfil/${profile.id}`} className="block px-4 py-3 text-base hover:bg-ice transition-colors text-navy font-medium" onClick={() => setDropdownOpen(false)}>Meu Perfil</Link>
                <button
                  onClick={handleLogoutClick}
                  className="w-full text-left px-4 py-3 text-base hover:bg-danger/5 hover:text-danger text-slate transition-colors flex items-center gap-2 border-t border-border-gray/50"
                >
                  <LogOut className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" /> Sair
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile state */}
        <div className="md:hidden text-navy flex items-center">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Abrir menu de navegação"
            aria-expanded={mobileMenuOpen}
          >
            <Menu className="w-6 h-6" strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div
            ref={mobileMenuRef}
            className="fixed inset-0 z-50 flex flex-col bg-white p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] modal-contain"
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navegação"
          >
            <div className="flex justify-between items-center mb-8 h-12 text-navy border-b border-border-gray pb-4">
               <BrandLockup
                 theme={isDarkMode ? 'dark' : 'light'}
                 variant="wordmark"
                 size="compact"
                 align="start"
                 showTagline={false}
                 showSocialBadge={false}
               />
               <button
                 onClick={() => setMobileMenuOpen(false)}
                 className="p-2 text-slate font-medium min-h-[44px] min-w-[44px]"
                 aria-label="Fechar menu"
               >
                 Fechar
               </button>
            </div>
            <div className="flex flex-col gap-2 text-lg text-slate">
               <Link to="/feed" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 border-b border-border-gray/50 hover:bg-ice font-bold text-navy flex items-center gap-3 min-h-[44px]"><Home className="w-5 h-5" aria-hidden="true" /> Feed</Link>
               <Link to="/mensagens" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 border-b border-border-gray/50 hover:bg-ice font-bold text-navy flex items-center gap-3 min-h-[44px]"><MessageSquare className="w-5 h-5" aria-hidden="true" /> Mensagens</Link>
               <Link to="/postos" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 border-b border-border-gray/50 hover:bg-ice font-bold text-navy flex items-center gap-3 min-h-[44px]"><Compass className="w-5 h-5" aria-hidden="true" /> Postos</Link>
               <Link to="/notificacoes" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 border-b border-border-gray/50 hover:bg-ice font-bold text-navy flex items-center gap-3 min-h-[44px]"><Bell className="w-5 h-5" aria-hidden="true" /> Notificações{unreadNotifications > 0 && <span className="ml-auto text-base bg-danger text-white px-2 py-0.5 rounded-full">{unreadNotifications}</span>}</Link>
               <Link to={`/perfil/${profile.id}`} onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 border-b border-border-gray/50 hover:bg-ice font-bold text-navy flex items-center gap-3 min-h-[44px]"><User className="w-5 h-5" aria-hidden="true" /> Meu Perfil</Link>
               <button onClick={toggleDarkMode} className="px-4 py-3 border-b border-border-gray/50 hover:bg-ice font-bold text-navy flex items-center gap-3 text-left min-h-[44px]">
                 {isDarkMode ? <Sun className="w-5 h-5" aria-hidden="true" /> : <Moon className="w-5 h-5" aria-hidden="true" />}
                 {isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
               </button>
               {profile.role === 'ADMIN' && (
                  <>
                    <Link to="/admin/membros" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 border-b border-border-gray/50 hover:bg-ice font-bold text-navy flex items-center gap-3 min-h-[44px]"><Shield className="w-5 h-5" aria-hidden="true" /> Painel Admin - Membros</Link>
                    <Link to="/admin/moderacao" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 border-b border-border-gray/50 hover:bg-ice font-bold text-navy flex items-center gap-3 min-h-[44px]"><Shield className="w-5 h-5" aria-hidden="true" /> Painel Admin - Moderação</Link>
                  </>
               )}
               <button onClick={handleLogoutClick} className="px-4 py-3 text-left border-border-gray/50 hover:bg-danger/5 hover:text-danger font-bold text-slate flex items-center gap-3 border-t mt-auto min-h-[44px]"><LogOut className="w-5 h-5" aria-hidden="true" /> Sair</button>
            </div>
          </div>
        )}

        {/* Logout Confirmation Dialog */}
        <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Saída</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja sair da sua conta?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel variant="ghost" size="md">Cancelar</AlertDialogCancel>
              <AlertDialogAction variant="danger" size="md" onClick={performLogout}>
                <LogOut className="w-4 h-4" aria-hidden="true" />
                Sair
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </nav>
    </>
  );
}
