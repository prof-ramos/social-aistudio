import { Link, useNavigate } from 'react-router-dom';
import { Menu, User, LogOut, Bell, Shield } from 'lucide-react';
import { authService } from '../../services/authService';
import { UserProfile } from '../../types';
import React, { useState, useEffect } from 'react';
import { notificationService } from '../../services/notificationService';
import { adminService } from '../../services/adminService';
import { cn } from '../../lib/utils';

export function Navbar({ profile, isAdminView }: { profile: UserProfile, isAdminView?: boolean }) {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);

  useEffect(() => {
    // Listen to personal notifications
    const unsubNotif = notificationService.subscribeToUnreadNotifications(
      profile.id,
      (count) => setUnreadNotifications(count)
    );

    // Listen to admin unread pending requests
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

  const handleLogout = async () => {
    await authService.signOut();
    navigate('/login');
  };

  return (
    <nav className="h-16 bg-navy text-white px-6 md:px-8 flex items-center justify-between flex-none shadow-md border-b border-navy-dark relative z-50">
      <div className="flex items-center gap-8 md:gap-12">
        <Link to="/feed" className="font-serif text-2xl font-bold tracking-tight">Social-ASOF</Link>
        <div className="hidden md:flex gap-6 text-sm font-medium">
          <Link to="/feed" className="text-sky hover:text-white transition-colors">Feed</Link>
          <Link to="/mensagens" className="text-slate-300 hover:text-white transition-colors">Mensagens</Link>
          <Link to="/postos" className="text-slate-300 hover:text-white transition-colors">Postos</Link>
          <Link to="/notificacoes" className="text-slate-300 hover:text-white transition-colors flex items-center gap-2">
            Notificações 
            {unreadNotifications > 0 && (
              <span className="bg-sky text-navy text-[10px] font-bold px-1.5 py-0.5 rounded-sm">{unreadNotifications}</span>
            )}
          </Link>
          <Link to={`/perfil/${profile.id}`} className="text-slate-300 hover:text-white transition-colors">Perfil</Link>
        </div>
      </div>

      {/* Desktop Actions */}
      <div className="hidden md:flex items-center gap-4">
        <Link to="/notificacoes" className="relative p-2 hover:bg-white/10 transition-colors rounded-none">
          <Bell className="w-5 h-5 opacity-80 hover:opacity-100" />
          {unreadNotifications > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-navy"></span>
          )}
        </Link>
        
        {profile.role === 'ADMIN' && (
           <div className="relative group">
             <Link to="/admin/membros" className="relative p-2 hover:bg-white/10 transition-colors rounded-none flex items-center" title="Painel Admin">
               <Shield className="w-5 h-5 opacity-80 hover:opacity-100" />
               {pendingRequests > 0 && (
                 <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-sky rounded-full border-2 border-navy"></span>
               )}
             </Link>
             <div className="absolute right-0 top-full mt-1 w-56 bg-white text-navy shadow-lg border border-border-gray hidden group-hover:block z-50">
                <Link to="/admin/membros" className="block px-4 py-3 text-sm hover:bg-ice transition-colors border-b border-border-gray focus:ring-2 focus:ring-navy focus:outline-none">Configurações & Membros</Link>
                <Link to="/admin/moderacao" className="block px-4 py-3 text-sm hover:bg-ice transition-colors focus:ring-2 focus:ring-navy focus:outline-none">Central de Moderação</Link>
             </div>
           </div>
        )}
        
        <div className="h-8 w-px bg-white/20 mx-2"></div>

        <div className="relative">
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 hover:bg-white/5 p-2 rounded-none transition-colors group focus:ring-2 focus:ring-sky focus:outline-none"
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold group-hover:text-sky transition-colors">{profile.name.split(' ')[0]}</p>
              <p className="text-[10px] text-sky uppercase tracking-wider">{profile.role === 'MEMBRO_ATIVO' ? 'Membro' : profile.role === 'MEMBRO_APOSENTADO' ? 'Aposentado' : 'Admin'}</p>
            </div>
            <div className="w-10 h-10 bg-ice border border-white/20 flex items-center justify-center text-navy font-bold uppercase overflow-hidden">
              {profile.avatarUrl ? <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" /> : profile.name.charAt(0)}
            </div>
          </button>
          
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white text-slate shadow-lg border border-border-gray">
              <div className="px-4 py-3 border-b border-border-gray">
                <p className="text-sm font-medium">{profile.name}</p>
                <p className="text-xs text-slate opacity-70 truncate">{profile.email}</p>
              </div>
              <Link to={`/perfil/${profile.id}`} className="block px-4 py-3 text-sm hover:bg-ice transition-colors focus:ring-2 focus:ring-navy focus:outline-none" onClick={() => setDropdownOpen(false)}>Meu Perfil</Link>
              <button 
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 min-h-[44px] text-sm hover:bg-ice transition-colors flex items-center gap-2 focus:ring-2 focus:ring-navy focus:outline-none"
              >
                <LogOut className="w-4 h-4" /> Sair
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile state */}
      <div className="md:hidden">
        <button onClick={() => setMobileMenuOpen(true)} className="p-2 min-h-[44px] min-w-[44px] focus:ring-2 focus:ring-white focus:outline-none flex items-center justify-center">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-navy z-50 flex flex-col p-4">
          <div className="flex justify-between items-center mb-8 h-12">
             <span className="font-serif text-2xl font-bold">Social-ASOF</span>
             <button onClick={() => setMobileMenuOpen(false)} className="p-2 min-h-[44px] font-medium focus:ring-2 focus:ring-white focus:outline-none">Fechar</button>
          </div>
          <div className="flex flex-col gap-4 text-lg">
             <Link to="/feed" onClick={() => setMobileMenuOpen(false)} className="p-4 min-h-[44px] border-b border-white/10 hover:bg-white/10 focus:ring-2 focus:ring-white focus:outline-none flex items-center">Feed</Link>
             <Link to="/mensagens" onClick={() => setMobileMenuOpen(false)} className="p-4 min-h-[44px] border-b border-white/10 hover:bg-white/10 focus:ring-2 focus:ring-white focus:outline-none flex items-center">Mensagens</Link>
             <Link to="/postos" onClick={() => setMobileMenuOpen(false)} className="p-4 min-h-[44px] border-b border-white/10 hover:bg-white/10 focus:ring-2 focus:ring-white focus:outline-none flex items-center">Postos</Link>
             <Link to="/notificacoes" onClick={() => setMobileMenuOpen(false)} className="p-4 min-h-[44px] border-b border-white/10 hover:bg-white/10 focus:ring-2 focus:ring-white focus:outline-none flex items-center">Notificações</Link>
             <Link to={`/perfil/${profile.id}`} onClick={() => setMobileMenuOpen(false)} className="p-4 min-h-[44px] border-b border-white/10 hover:bg-white/10 focus:ring-2 focus:ring-white focus:outline-none flex items-center">Meu Perfil</Link>
             {profile.role === 'ADMIN' && (
                <>
                  <Link to="/admin/membros" onClick={() => setMobileMenuOpen(false)} className="p-4 min-h-[44px] border-b border-white/10 hover:bg-white/10 focus:ring-2 focus:ring-white focus:outline-none flex items-center">Painel Admin - Membros</Link>
                  <Link to="/admin/moderacao" onClick={() => setMobileMenuOpen(false)} className="p-4 min-h-[44px] border-b border-white/10 hover:bg-white/10 focus:ring-2 focus:ring-white focus:outline-none flex items-center">Painel Admin - Moderação</Link>
                </>
             )}
             <button onClick={handleLogout} className="p-4 min-h-[44px] text-left border-b border-white/10 hover:bg-white/10 focus:ring-2 focus:ring-white focus:outline-none flex items-center">Sair</button>
          </div>
        </div>
      )}
    </nav>
  );
}

function NavLink({ to, children }: { to: string, children: React.ReactNode }) {
  // We can use useLocation to check if active, but for simplicity:
  return (
    <Link to={to} className="px-4 py-2 hover:bg-white/10 transition-colors">
      {children}
    </Link>
  );
}
