import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, User, LogOut, Bell, Shield, Search, MessageSquare, Map, Compass, Home, Moon, Sun } from 'lucide-react';
import { authService } from '../../services/authService';
import { UserProfile } from '../../types';
import React, { useState, useEffect } from 'react';
import { notificationService } from '../../services/notificationService';
import { adminService } from '../../services/adminService';
import { cn } from '../../lib/utils';

export function Navbar({ profile, isAdminView }: { profile: UserProfile, isAdminView?: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  useEffect(() => {
    const isDark = localStorage.getItem('asof-dark-mode') === 'true';
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('asof-dark-mode', String(newDarkMode));
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

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

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
    setDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  const performLogout = async () => {
    await authService.signOut();
    navigate('/login');
  };

  const navItems = [
    { to: '/feed', label: 'Feed', icon: Home },
    { to: '/mensagens', label: 'Mensagens', icon: MessageSquare },
    { to: '/postos', label: 'Postos', icon: Compass },
  ];

  return (
    <nav className="h-16 bg-white border-b border-border-gray shadow-sm sticky top-0 z-50 bg-white/90 backdrop-blur-md px-6 md:px-8 flex items-center justify-between flex-none font-sans transition-all">
      <div className="flex items-center gap-8 xl:gap-12 w-full md:w-auto">
        <Link to="/feed" className="font-serif text-2xl font-bold tracking-tight text-navy">Social-ASOF</Link>
        <div className="hidden md:flex gap-2 text-sm font-medium h-16">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link 
                key={item.to}
                to={item.to} 
                className={`flex items-center gap-2 px-3 transition-colors border-b-2 h-full ${isActive ? 'border-navy text-navy font-bold' : 'border-transparent text-slate hover:text-navy'}`}
              >
                <Icon strokeWidth={isActive ? 2 : 1.5} className="w-5 h-5" />
                <span className="hidden lg:inline-block">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="hidden md:flex flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate/50" strokeWidth={1.5} />
          </div>
          <input 
            type="text" 
            className="block w-full pl-10 pr-4 py-2 bg-ice/50 border border-transparent rounded-full text-sm placeholder-slate/50 focus:outline-none focus:ring-1 focus:ring-navy focus:border-navy focus:bg-white transition-all text-navy" 
            placeholder="Buscar membros, posts ou postos..." 
          />
        </div>
      </div>

      {/* Desktop Actions */}
      <div className="hidden md:flex items-center gap-2 lg:gap-4">
        {/* Navigation Items with Icons */}
        <button
          onClick={toggleDarkMode}
          className="relative p-2 transition-colors rounded-none flex items-center h-16 border-b-2 border-transparent text-slate hover:text-navy hover:bg-ice/50"
          title={isDarkMode ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
        >
          {isDarkMode ? <Sun className="w-5 h-5" strokeWidth={1.5} /> : <Moon className="w-5 h-5" strokeWidth={1.5} />}
        </button>

        <Link 
          to="/notificacoes" 
          className={`relative p-2 transition-colors rounded-none flex items-center h-16 border-b-2 ${location.pathname.startsWith('/notificacoes') ? 'border-navy text-navy font-bold' : 'border-transparent text-slate hover:text-navy hover:bg-ice/50'}`}
          title="Notificações"
        >
          <Bell className="w-5 h-5" strokeWidth={location.pathname.startsWith('/notificacoes') ? 2 : 1.5} />
          {unreadNotifications > 0 && (
            <span className="absolute top-3 right-2 w-2 h-2 bg-danger rounded-full animate-pulse border border-white"></span>
          )}
        </Link>
        
        {profile.role === 'ADMIN' && (
           <div className="relative group flex items-center h-16">
             <Link 
               to="/admin/membros" 
               className={`relative p-2 transition-colors rounded-none flex items-center h-16 border-b-2 ${location.pathname.startsWith('/admin') ? 'border-navy text-navy font-bold' : 'border-transparent text-slate hover:text-navy hover:bg-ice/50'}`}
               title="Painel Admin"
             >
               <Shield className="w-5 h-5" strokeWidth={location.pathname.startsWith('/admin') ? 2 : 1.5} />
               {pendingRequests > 0 && (
                 <span className="absolute top-3 right-2 w-2 h-2 bg-sky rounded-full animate-pulse border border-white"></span>
               )}
             </Link>
             <div className="absolute right-0 top-full mt-0 w-56 bg-white text-navy shadow-md border border-border-gray hidden group-hover:block z-50">
                <Link to="/admin/membros" className="block px-4 py-3 text-sm hover:bg-ice transition-colors border-b border-border-gray">Configurações & Membros</Link>
                <Link to="/admin/moderacao" className="block px-4 py-3 text-sm hover:bg-ice transition-colors">Central de Moderação</Link>
             </div>
           </div>
        )}
        
        <div className="h-6 w-px bg-border-gray mx-1 lg:mx-2"></div>

        <div className="relative flex items-center h-16">
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 hover:bg-ice/50 p-2 rounded-none transition-colors group focus:outline-none"
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-navy group-hover:text-sky transition-colors">{profile.name.split(' ')[0]}</p>
              <p className="text-[10px] text-slate uppercase tracking-wider">{profile.role === 'MEMBRO_ATIVO' ? 'Membro' : profile.role === 'MEMBRO_APOSENTADO' ? 'Aposentado' : 'Admin'}</p>
            </div>
            <div className="w-9 h-9 bg-ice border border-border-gray flex items-center justify-center text-navy font-bold uppercase overflow-hidden">
              {profile.avatarUrl ? <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" /> : profile.name.charAt(0)}
            </div>
          </button>
          
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-0 w-48 bg-white text-slate shadow-md border border-border-gray z-50">
              <div className="px-4 py-3 border-b border-border-gray bg-ice/30">
                <p className="text-sm font-bold text-navy">{profile.name}</p>
                <p className="text-xs text-slate opacity-70 truncate">{profile.email}</p>
              </div>
              <Link to={`/perfil/${profile.id}`} className="block px-4 py-3 text-sm hover:bg-ice transition-colors text-navy font-medium" onClick={() => setDropdownOpen(false)}>Meu Perfil</Link>
              <button 
                onClick={handleLogoutClick}
                className="w-full text-left px-4 py-3 text-sm hover:bg-danger/5 hover:text-danger text-slate transition-colors flex items-center gap-2 border-t border-border-gray/50"
              >
                <LogOut className="w-4 h-4" strokeWidth={1.5} /> Sair
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile state */}
      <div className="md:hidden text-navy flex items-center">
        <button onClick={() => setMobileMenuOpen(true)} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center">
          <Menu className="w-6 h-6" strokeWidth={1.5} />
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col p-4">
          <div className="flex justify-between items-center mb-8 h-12 text-navy border-b border-border-gray pb-4">
             <span className="font-serif text-2xl font-bold w-full">Social-ASOF</span>
             <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-slate font-medium">Fechar</button>
          </div>
          <div className="flex flex-col gap-2 text-lg text-slate">
             <Link to="/feed" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 border-b border-border-gray/50 hover:bg-ice font-bold text-navy flex items-center gap-3"><Home className="w-5 h-5"/> Feed</Link>
             <Link to="/mensagens" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 border-b border-border-gray/50 hover:bg-ice font-bold text-navy flex items-center gap-3"><MessageSquare className="w-5 h-5"/> Mensagens</Link>
             <Link to="/postos" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 border-b border-border-gray/50 hover:bg-ice font-bold text-navy flex items-center gap-3"><Compass className="w-5 h-5"/> Postos</Link>
             <Link to="/notificacoes" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 border-b border-border-gray/50 hover:bg-ice font-bold text-navy flex items-center gap-3"><Bell className="w-5 h-5"/> Notificações</Link>
             <Link to={`/perfil/${profile.id}`} onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 border-b border-border-gray/50 hover:bg-ice font-bold text-navy flex items-center gap-3"><User className="w-5 h-5"/> Meu Perfil</Link>
             <button onClick={toggleDarkMode} className="px-4 py-3 border-b border-border-gray/50 hover:bg-ice font-bold text-navy flex items-center gap-3 text-left">
               {isDarkMode ? <Sun className="w-5 h-5"/> : <Moon className="w-5 h-5"/>} 
               {isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
             </button>
             {profile.role === 'ADMIN' && (
                <>
                  <Link to="/admin/membros" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 border-b border-border-gray/50 hover:bg-ice font-bold text-navy flex items-center gap-3"><Shield className="w-5 h-5"/> Painel Admin - Membros</Link>
                  <Link to="/admin/moderacao" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 border-b border-border-gray/50 hover:bg-ice font-bold text-navy flex items-center gap-3"><Shield className="w-5 h-5"/> Painel Admin - Moderação</Link>
                </>
             )}
             <button onClick={handleLogoutClick} className="px-4 py-3 text-left border-border-gray/50 hover:bg-danger/5 hover:text-danger font-bold text-slate flex items-center gap-3 border-t mt-auto"><LogOut className="w-5 h-5" /> Sair</button>
          </div>
        </div>
      )}

      {/* Logout Confirmation Dialog */}
      {showLogoutDialog && (
        <div className="fixed inset-0 bg-navy/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white border border-border-gray shadow-lg max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-serif font-bold text-navy mb-2">Confirmar Saída</h3>
            <p className="text-slate mb-6">Tem certeza que deseja sair da sua conta?</p>
            <div className="flex items-center justify-end gap-3">
              <button 
                onClick={() => setShowLogoutDialog(false)}
                className="px-4 py-2 text-slate hover:bg-ice transition-colors font-medium border border-transparent"
              >
                Cancelar
              </button>
              <button 
                onClick={performLogout}
                className="px-4 py-2 bg-danger text-white hover:bg-danger/90 transition-colors font-medium flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
