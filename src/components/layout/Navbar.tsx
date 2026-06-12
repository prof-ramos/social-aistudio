import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, User, LogOut, Bell, Shield, Search, MessageSquare, Compass, Home, Moon, Sun } from 'lucide-react';
import { authService } from '../../services/authService';
import { UserProfile } from '../../types';
import React, { useState, useEffect, useRef } from 'react';
import { notificationService } from '../../services/notificationService';
import { adminService } from '../../services/adminService';
import { cn } from '../../lib/utils';
import { useDarkMode } from '../../hooks/useDarkMode';
import { useGlobalSearch } from '../../hooks/useGlobalSearch';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from '../ui/sheet';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

export function Navbar({ profile, isAdminView }: { profile: UserProfile, isAdminView?: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const { query, setQuery, results, isSearching, clearQuery } = useGlobalSearch();

  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  // Clear search when clicking outside the search area
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
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
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [query, clearQuery]);


  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    'relative p-2 transition-colors rounded-none flex items-center h-16 border-b-2',
                    location.pathname.startsWith('/admin') ? 'border-navy text-navy font-bold' : 'border-transparent text-slate hover:text-navy hover:bg-ice/50'
                  )}
                  title="Painel Admin"
                  aria-label="Painel Admin"
                >
                  <Shield className="w-5 h-5" strokeWidth={location.pathname.startsWith('/admin') ? 2 : 1.5} aria-hidden="true" />
                  {pendingRequests > 0 && (
                    <span className="absolute top-3 right-2 w-2 h-2 bg-sky rounded-full animate-pulse border border-white" aria-hidden="true"></span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-none border-border-gray">
                <DropdownMenuItem asChild className="rounded-none px-4 py-3 text-base text-navy hover:bg-ice focus:bg-ice focus:text-navy cursor-pointer">
                  <Link to="/admin/membros">Configurações & Membros</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-none px-4 py-3 text-base text-navy hover:bg-ice focus:bg-ice focus:text-navy cursor-pointer">
                  <Link to="/admin/moderacao">Central de Moderação</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <div className="h-6 w-px bg-border-gray mx-1 lg:mx-2" aria-hidden="true"></div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-3 hover:bg-ice/50 p-2 rounded-none transition-colors group focus:outline-none focus:ring-2 focus:ring-navy"
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
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-none border-border-gray p-0">
              <div className="px-4 py-3 border-b border-border-gray bg-ice/30">
                <p className="text-base font-bold text-navy">{profile.name}</p>
                <p className="text-sm text-slate truncate">{profile.email}</p>
              </div>
              <DropdownMenuItem asChild className="rounded-none px-4 py-3 text-base text-navy font-medium hover:bg-ice focus:bg-ice focus:text-navy cursor-pointer">
                <Link to={`/perfil/${profile.id}`}>Meu Perfil</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-0 bg-border-gray/50" />
              <DropdownMenuItem
                className="rounded-none px-4 py-3 text-base text-slate hover:bg-danger/5 hover:text-danger focus:bg-danger/5 focus:text-danger cursor-pointer flex items-center gap-2"
                onSelect={handleLogoutClick}
              >
                <LogOut className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile state */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <button
              className="md:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-navy"
              aria-label="Abrir menu de navegação"
            >
              <Menu className="w-6 h-6" strokeWidth={1.5} aria-hidden="true" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[350px] bg-white p-0 flex flex-col">
            <SheetHeader className="p-4 border-b border-border-gray">
              <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
              <BrandLockup
                theme={isDarkMode ? 'dark' : 'light'}
                variant="wordmark"
                size="compact"
                align="start"
                showTagline={false}
                showSocialBadge={false}
              />
            </SheetHeader>
            <div className="flex flex-col gap-2 text-lg text-slate p-4 overflow-y-auto">
              <SheetClose asChild>
                <Link to="/feed" className="px-4 py-3 border-b border-border-gray/50 hover:bg-ice font-bold text-navy flex items-center gap-3 min-h-[44px]"><Home className="w-5 h-5" aria-hidden="true" /> Feed</Link>
              </SheetClose>
              <SheetClose asChild>
                <Link to="/mensagens" className="px-4 py-3 border-b border-border-gray/50 hover:bg-ice font-bold text-navy flex items-center gap-3 min-h-[44px]"><MessageSquare className="w-5 h-5" aria-hidden="true" /> Mensagens</Link>
              </SheetClose>
              <SheetClose asChild>
                <Link to="/postos" className="px-4 py-3 border-b border-border-gray/50 hover:bg-ice font-bold text-navy flex items-center gap-3 min-h-[44px]"><Compass className="w-5 h-5" aria-hidden="true" /> Postos</Link>
              </SheetClose>
              <SheetClose asChild>
                <Link to="/notificacoes" className="px-4 py-3 border-b border-border-gray/50 hover:bg-ice font-bold text-navy flex items-center gap-3 min-h-[44px]"><Bell className="w-5 h-5" aria-hidden="true" /> Notificações{unreadNotifications > 0 && <span className="ml-auto text-base bg-danger text-white px-2 py-0.5 rounded-full">{unreadNotifications}</span>}</Link>
              </SheetClose>
              <SheetClose asChild>
                <Link to={`/perfil/${profile.id}`} className="px-4 py-3 border-b border-border-gray/50 hover:bg-ice font-bold text-navy flex items-center gap-3 min-h-[44px]"><User className="w-5 h-5" aria-hidden="true" /> Meu Perfil</Link>
              </SheetClose>
              <SheetClose asChild>
                <button onClick={toggleDarkMode} className="px-4 py-3 border-b border-border-gray/50 hover:bg-ice font-bold text-navy flex items-center gap-3 text-left min-h-[44px]">
                  {isDarkMode ? <Sun className="w-5 h-5" aria-hidden="true" /> : <Moon className="w-5 h-5" aria-hidden="true" />}
                  {isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
                </button>
              </SheetClose>
              {profile.role === 'ADMIN' && (
                <>
                  <SheetClose asChild>
                    <Link to="/admin/membros" className="px-4 py-3 border-b border-border-gray/50 hover:bg-ice font-bold text-navy flex items-center gap-3 min-h-[44px]"><Shield className="w-5 h-5" aria-hidden="true" /> Painel Admin - Membros</Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link to="/admin/moderacao" className="px-4 py-3 border-b border-border-gray/50 hover:bg-ice font-bold text-navy flex items-center gap-3 min-h-[44px]"><Shield className="w-5 h-5" aria-hidden="true" /> Painel Admin - Moderação</Link>
                  </SheetClose>
                </>
              )}
            </div>
            <SheetFooter className="p-4 border-t border-border-gray mt-auto">
              <SheetClose asChild>
                <button onClick={handleLogoutClick} className="w-full text-left px-4 py-3 hover:bg-danger/5 hover:text-danger font-bold text-slate flex items-center gap-3 min-h-[44px]"><LogOut className="w-5 h-5" aria-hidden="true" /> Sair</button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>

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
