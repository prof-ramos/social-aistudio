import { Suspense, lazy, type ComponentType, type LazyExoticComponent } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useOutletContext } from 'react-router-dom';
import { CommandPalette } from '../components/layout/CommandPalette';
import { Login } from '../pages/Login';
import { RegisterRequest } from '../pages/RegisterRequest';
import ForgotPassword from '../pages/ForgotPassword';
import { Feed } from '../pages/Feed';
import { useAuth } from '../contexts/AuthContext';
import { LoadingUI, PageSkeleton } from '../components/ui/LoadingUI';
import { AppLayout } from '../layout/AppLayout';
import type { UserProfile } from '../types';

type ProfilePageComponent =
  | ComponentType<{ profile: UserProfile }>
  | LazyExoticComponent<ComponentType<{ profile: UserProfile }>>;

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

function ProfileRoute({ component: Component }: { component: ProfilePageComponent }) {
  const profile = useOutletContext<UserProfile>();
  return <Component profile={profile} />;
}

export function AppRoutes() {
  const { user, profile, loading } = useAuth();
  const authenticatedProfile = user && profile ? profile : null;

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingUI />}>
        <Routes>
          <Route path="/" element={authenticatedProfile ? <Navigate to="/feed" replace /> : <Navigate to="/login" replace />} />

          {/* Auth Routes */}
          <Route path="/login" element={authenticatedProfile ? <Navigate to="/feed" replace /> : <Login />} />
          <Route path="/solicitar-acesso" element={<RegisterRequest />} />
          <Route path="/recuperar-senha" element={<ForgotPassword />} />

          {/* App Routes */}
          <Route element={authenticatedProfile ? <AppLayout profile={authenticatedProfile} /> : <Navigate to="/login" replace />}>
            <Route path="/feed" element={<ProfileRoute component={Feed} />} />
            <Route path="/feed/:id" element={<ProfileRoute component={PostDetails} />} />
            <Route path="/mensagens" element={<ProfileRoute component={Messages} />} />
            <Route path="/postos" element={<Postos />} />
            <Route path="/postos/:slug" element={<ProfileRoute component={PostoDetails} />} />
            <Route path="/notificacoes" element={<ProfileRoute component={Notifications} />} />
            <Route path="/perfil/:id" element={<ProfileRoute component={Profile} />} />
            <Route path="/carreira" element={<ProfileRoute component={CarreiraPromocao} />} />
            <Route path="/aposentadoria" element={<ProfileRoute component={Aposentadoria} />} />
          </Route>

          {/* Admin Routes */}
          <Route
            element={
              authenticatedProfile?.role === 'ADMIN'
                ? <AppLayout profile={authenticatedProfile} isAdminView />
                : <Navigate to={authenticatedProfile ? '/feed' : '/login'} replace />
            }
          >
             <Route path="/admin" element={<AdminHub />} />
             <Route path="/admin/membros" element={<AdminMembers />} />
             <Route path="/admin/moderacao" element={<AdminModeration />} />
          </Route>
        </Routes>
      </Suspense>
      <CommandPalette />
    </BrowserRouter>
  );
}
