import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '../pages/Login';
import { RegisterRequest } from '../pages/RegisterRequest';
import ForgotPassword from '../pages/ForgotPassword';
import { Feed } from '../pages/Feed';
import { useAuth } from '../contexts/AuthContext';
import { LoadingUI, PageSkeleton } from '../components/ui/LoadingUI';
import { AppLayout } from '../layout/AppLayout';

const PostDetails = lazy(() => import('../pages/PostDetails'));
const Postos = lazy(() => import('../pages/Postos').then(m => ({ default: m.Postos })));
const PostoDetails = lazy(() => import('../pages/PostoDetails').then(m => ({ default: m.PostoDetails })));
const AdminMembers = lazy(() => import('../pages/AdminMembers').then(m => ({ default: m.AdminMembers })));
const AdminModeration = lazy(() => import('../pages/AdminModeration'));
const AdminHub = lazy(() => import('../pages/AdminHub'));
const Profile = lazy(() => import('../pages/Profile').then(m => ({ default: m.Profile })));
const Notifications = lazy(() => import('../pages/Notifications').then(m => ({ default: m.Notifications })));
const Messages = lazy(() => import('../pages/Messages').then(m => ({ default: m.Messages })));
const CarreiraPromocao = lazy(() => import('../pages/CarreiraPromocao').then(m => ({ default: m.CarreiraPromocao })));
const Aposentadoria = lazy(() => import('../pages/Aposentadoria').then(m => ({ default: m.Aposentadoria })));

const ProtoFeed = lazy(() => import('../pages/ProtoFeed').then(m => ({ default: m.default })));

export function AppRoutes() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingUI />}>
        <Routes>
          <Route path="/" element={user && profile ? <Navigate to="/feed" replace /> : <Navigate to="/login" replace />} />

          {/* Auth Routes */}
          <Route path="/login" element={user && profile ? <Navigate to="/feed" replace /> : <Login />} />
          <Route path="/solicitar-acesso" element={<RegisterRequest />} />
          <Route path="/recuperar-senha" element={<ForgotPassword />} />

          {/* App Routes */}
          <Route element={user && profile ? <AppLayout profile={profile} /> : <Navigate to="/login" replace />}>
            <Route path="/feed" element={<Feed profile={profile!} />} />
            <Route path="/feed/:id" element={<PostDetails profile={profile!} />} />
            <Route path="/mensagens" element={<Messages profile={profile!} />} />
            <Route path="/postos" element={<Postos />} />
            <Route path="/postos/:slug" element={<PostoDetails profile={profile!} />} />
            <Route path="/notificacoes" element={<Notifications profile={profile!} />} />
            <Route path="/perfil/:id" element={<Profile profile={profile!} />} />
            <Route path="/carreira" element={<CarreiraPromocao profile={profile!} />} />
            <Route path="/aposentadoria" element={<Aposentadoria profile={profile!} />} />
            <Route path="/proto-feed" element={<ProtoFeed />} />
          </Route>

          {/* Admin Routes */}
          <Route element={user && profile?.role === 'ADMIN' ? <AppLayout profile={profile} isAdminView /> : <Navigate to="/feed" replace />}>
             <Route path="/admin" element={<AdminHub />} />
             <Route path="/admin/membros" element={<AdminMembers />} />
             <Route path="/admin/moderacao" element={<AdminModeration />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
