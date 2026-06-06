import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, Link } from 'react-router-dom';
import { authService } from './services/authService';
import { systemService } from './services/systemService';
import { Navbar } from './components/layout/Navbar';
import { Login } from './pages/Login';
import { RegisterRequest } from './pages/RegisterRequest';
import ForgotPassword from './pages/ForgotPassword';
import { Feed } from './pages/Feed';
import PostDetails from './pages/PostDetails';
import { Postos } from './pages/Postos';
import { AdminMembers } from './pages/AdminMembers';
import AdminModeration from './pages/AdminModeration';
import { PostoDetails } from './pages/PostoDetails';

import { Profile } from './pages/Profile';
import { Notifications } from './pages/Notifications';
import { Messages } from './pages/Messages';
import { Home, Building2, Briefcase, Archive, MessageSquare } from 'lucide-react';
import { UserProfile, AuthUser } from './types';

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check connection
    systemService.checkConnection();

    const unsubscribe = authService.onAuthStateChanged((u, p) => {
      setUser(u);
      setProfile(p);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="h-screen w-full flex items-center justify-center bg-ice"><p className="text-navy font-sans">Carregando Social-ASOF...</p></div>;
  }

  return (
    <BrowserRouter>
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
        </Route>

        {/* Admin Routes */}
        <Route element={user && profile?.role === 'ADMIN' ? <Layout profile={profile} isAdminView /> : <Navigate to="/feed" replace />}>
           <Route path="/admin/membros" element={<AdminMembers />} />
           <Route path="/admin/moderacao" element={<AdminModeration />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

function Layout({ profile, isAdminView }: { profile: UserProfile, isAdminView?: boolean }) {
  return (
    <div className="h-screen w-full bg-ice font-sans flex flex-col overflow-hidden">
      <Navbar profile={profile} isAdminView={isAdminView} />
      <main className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-border-gray text-navy hidden md:flex flex-col py-8 px-6 flex-none z-10 shadow-sm relative">
          <div className="mb-8">
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate/50 mb-4 px-4">Navegação</p>
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
                <div className="flex items-center gap-3 text-slate/40 py-3 px-4 rounded-none cursor-not-allowed">
                  <Briefcase className="w-4 h-4" /> Carreira e Promoção
                </div>
              </li>
              <li>
                <div className="flex items-center gap-3 text-slate/40 py-3 px-4 rounded-none cursor-not-allowed">
                  <Archive className="w-4 h-4" /> Aposentadoria
                </div>
              </li>
            </ul>
          </div>
          <div className="mt-auto">
            <div className="p-4 bg-ice border border-border-gray rounded-none shadow-sm">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate/60 mb-1">Próximo Plantão</p>
              <p className="text-sm font-bold text-navy">Brasília, DF</p>
              <p className="text-xs text-slate mt-1">12 Out • 08:00 - 18:00</p>
            </div>
          </div>
        </aside>

        {/* Main scrollable content area */}
        <section className="flex-1 p-16 overflow-y-auto bg-ice">
          <div className="flex flex-col mx-auto max-w-5xl gap-8">
            <Outlet />
          </div>
        </section>
      </main>
    </div>
  );
}
